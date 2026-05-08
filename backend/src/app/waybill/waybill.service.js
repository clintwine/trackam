const repo = require("./waybill.repository");
const shipmentsRepo = require("../shipments/shipments.repository");
const handoverRepo = require("../handover/handover.repository");
const { query } = require("../../core/db/postgres");
const crypto = require("crypto");
const sms = require("../../core/sms");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

const REQUIRED_FIELDS = ["senderName", "senderPhone", "receiverName", "receiverPhone", "receiverAddress", "goodsDescription", "pickupLocation", "deliveryLocation"];
const OTP_TTL_MINUTES = 10;
const TOKEN_TTL_MINUTES = 60;

// ── Sender phone OTP ──────────────────────────────────────────────────────────

async function requestSenderOtp({ phone }) {
  if (!phone) throw Object.assign(new Error("phone is required"), { status: 400 });

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  const otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  const result = await query(
    `INSERT INTO phone_verifications (phone, otp_hash, otp_expires_at)
     VALUES ($1, $2, $3) RETURNING id`,
    [phone, otpHash, otpExpiresAt]
  );

  await sms.sendSms(phone, `Your Trackam waybill code: ${otp}. Valid ${OTP_TTL_MINUTES} minutes.`);
  return { verificationId: result.rows[0].id };
}

async function verifySenderOtp({ verificationId, otp }) {
  if (!verificationId || !otp) {
    throw Object.assign(new Error("verificationId and otp are required"), { status: 400 });
  }

  const otpHash = crypto.createHash("sha256").update(String(otp)).digest("hex");
  const check = await query(
    `SELECT id, phone FROM phone_verifications
     WHERE id = $1 AND otp_hash = $2 AND otp_expires_at > NOW() AND verified_at IS NULL`,
    [verificationId, otpHash]
  );
  if (!check.rows[0]) {
    throw Object.assign(new Error("Invalid or expired OTP"), { status: 401 });
  }

  const token = crypto.randomBytes(24).toString("hex");
  const tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await query(
    `UPDATE phone_verifications
       SET verified_at = NOW(), token = $1, token_expires_at = $2, otp_hash = NULL
     WHERE id = $3`,
    [token, tokenExpiresAt, verificationId]
  );

  return { verificationToken: token, phone: check.rows[0].phone };
}

async function generateWaybill(body) {
  for (const field of REQUIRED_FIELDS) {
    if (!body[field]) throw Object.assign(new Error(`${field} is required`), { status: 400 });
  }

  // Require sender phone verification
  if (!body.verificationToken) {
    throw Object.assign(new Error("verificationToken is required — verify the sender's phone first"), { status: 400 });
  }

  const tokenCheck = await query(
    `SELECT phone FROM phone_verifications
     WHERE token = $1 AND token_expires_at > NOW() AND verified_at IS NOT NULL`,
    [body.verificationToken]
  );
  if (!tokenCheck.rows[0]) {
    throw Object.assign(new Error("Invalid or expired verification token"), { status: 401 });
  }

  // Burn the token so it can't be reused
  await query(`UPDATE phone_verifications SET token_expires_at = NOW() WHERE token = $1`, [body.verificationToken]);

  return repo.create(body);
}

async function getWaybill(id) {
  const waybill = await repo.getById(id);
  if (!waybill) throw Object.assign(new Error("Waybill not found"), { status: 404 });
  return waybill;
}

async function getWaybillByNumber(waybillNumber) {
  const waybill = await repo.getByNumber(waybillNumber);
  if (!waybill) throw Object.assign(new Error("Waybill not found"), { status: 404 });
  return waybill;
}

async function getOperatorWaybills(userId) {
  return repo.listByUser(userId);
}

async function claimWaybill(userId, { waybillNumber, claimToken }) {
  if (!waybillNumber || !claimToken) {
    throw Object.assign(new Error("waybillNumber and claimToken are required"), { status: 400 });
  }

  const waybill = await repo.getByNumber(waybillNumber);
  if (!waybill) throw Object.assign(new Error("Waybill not found"), { status: 404 });

  if (!waybill.claimToken || waybill.claimToken.toUpperCase() !== claimToken.trim().toUpperCase()) {
    throw Object.assign(new Error("Invalid claim token"), { status: 403 });
  }
  if (waybill.claimedAt) {
    throw Object.assign(new Error("This waybill has already been claimed by an operator"), { status: 409 });
  }

  // Claiming = taking on the job — auto-create the operator's shipment leg
  const shipment = await shipmentsRepo.create({
    userId,
    routeId: null,
    riderId: null,
    goodsDescription: waybill.goodsDescription,
    pickupLocation: waybill.pickupLocation,
    deliveryLocation: waybill.deliveryLocation,
    distanceKm: 0,
    riderFee: 0,
    fuelCost: 0,
    totalCost: 0,
    shipmentValue: waybill.declaredValueNgn || 0,
    riskScore: "low",
    riskScorePoints: 0,
    riskScoreReasons: [],
    expectedDeliveryDate: null,
    notes: null,
    recipientName: waybill.receiverName,
    recipientPhone: waybill.receiverPhone,
  });

  // Link the shipment to the waybill (cross-operator chain key)
  await query(`UPDATE shipments SET waybill_id = $1 WHERE id = $2`, [waybill.id, shipment.id]);

  const claimed = await repo.claim(waybill.id, userId);
  if (!claimed) {
    throw Object.assign(new Error("This waybill was just claimed by another operator"), { status: 409 });
  }

  // Create the first PoH event: Sender → Operator (proof of pickup)
  const operatorRow = await query(`SELECT display_name, email FROM users WHERE id = $1`, [userId]);
  const operatorName = operatorRow.rows[0]?.display_name || operatorRow.rows[0]?.email || "Operator";

  await handoverRepo.createEvent({
    shipmentId: shipment.id,
    waybillId: waybill.id,
    tokenId: null,          // no token — synthetic pickup event
    giverUserId: null,
    giverName: waybill.senderName,
    giverPhone: waybill.senderPhone,
    giverActorType: "ACTOR_SENDER",
    receiverName: operatorName,
    receiverBvn: null,      // operator BVN not captured at claim time
    receiverPhone: null,
    receiverActorType: "ACTOR_HUB",
    custodianSessionId: null,
    latitude: null,
    longitude: null,
  });

  return { ...claimed, shipmentId: shipment.id };
}

// Operator B joins a waybill leg using the PoH hash they received as proof of custody transfer.
async function joinLeg(userId, waybillId, { proofHash }) {
  if (!proofHash) throw Object.assign(new Error("proofHash is required"), { status: 400 });

  const waybill = await repo.getById(waybillId);
  if (!waybill) throw Object.assign(new Error("Waybill not found"), { status: 404 });

  // Verify the PoH exists for this waybill and the receiver was a hub/courier actor
  const eventCheck = await query(
    `SELECT id FROM handover_events
     WHERE waybill_id = $1 AND proof_hash = $2
       AND receiver_actor_type IN ('ACTOR_HUB', 'ACTOR_COURIER')`,
    [waybillId, proofHash]
  );
  if (!eventCheck.rows[0]) {
    throw Object.assign(
      new Error("No matching handover event found for this waybill and proof hash"),
      { status: 403 }
    );
  }

  // Prevent duplicate legs for the same operator on the same waybill
  const existing = await query(
    `SELECT id FROM shipments WHERE user_id = $1 AND waybill_id = $2`,
    [userId, waybillId]
  );
  if (existing.rows[0]) {
    throw Object.assign(new Error("You already have a leg for this waybill"), { status: 409 });
  }

  const shipment = await shipmentsRepo.create({
    userId,
    routeId: null,
    riderId: null,
    goodsDescription: waybill.goodsDescription,
    pickupLocation: waybill.pickupLocation,
    deliveryLocation: waybill.deliveryLocation,
    distanceKm: 0,
    riderFee: 0,
    fuelCost: 0,
    totalCost: 0,
    shipmentValue: waybill.declaredValueNgn || 0,
    riskScore: "low",
    riskScorePoints: 0,
    riskScoreReasons: [],
    expectedDeliveryDate: null,
    notes: null,
    recipientName: waybill.receiverName,
    recipientPhone: waybill.receiverPhone,
  });

  await query(`UPDATE shipments SET waybill_id = $1 WHERE id = $2`, [waybill.id, shipment.id]);

  return { shipmentId: shipment.id, waybillId };
}

// Public — returns the full PoH chain for a waybill across all operators
async function getChain(waybillId) {
  const waybill = await repo.getById(waybillId);
  if (!waybill) throw Object.assign(new Error("Waybill not found"), { status: 404 });

  const events = await repo.getChain(waybillId);
  const isClaimed = Boolean(waybill.claimedAt);
  const isDelivered = events.some((e) => e.receiverActorType === "ACTOR_RECEIVER");

  return {
    waybill: {
      id: waybill.id,
      waybillNumber: waybill.waybillNumber,
      goodsDescription: waybill.goodsDescription,
      pickupLocation: waybill.pickupLocation,
      deliveryLocation: waybill.deliveryLocation,
      estimatedWeightKg: waybill.estimatedWeightKg,
      createdAt: waybill.createdAt,
      isClaimed,
      isDelivered,
    },
    chain: events,
    totalHandovers: events.length,
  };
}

async function generatePdf(waybill, frontendUrl) {
  const trackingUrl = `${frontendUrl}/track/${waybill.id}`;
  const qrDataUrl = await QRCode.toDataURL(trackingUrl, { width: 160, margin: 1 });
  const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A5", margins: { top: 40, bottom: 40, left: 40, right: 40 } });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width - 80;

    doc.rect(40, 40, W, 36).fill("#1c1917");
    doc.fontSize(16).fillColor("#ffffff").font("Helvetica-Bold")
      .text("TRACKAM WAYBILL", 48, 50, { width: W - 120 });
    doc.fontSize(9).fillColor("#d6d3d1").text(waybill.waybillNumber, 48, 67);
    doc.image(qrBuffer, doc.page.width - 100, 44, { width: 72, height: 72 });
    doc.moveDown(2.8);

    const section = (label) => {
      doc.fontSize(7).fillColor("#78716c").font("Helvetica").text(label.toUpperCase(), { characterSpacing: 0.8 });
      doc.moveDown(0.2);
    };
    const row = (label, value) => {
      doc.fontSize(9).fillColor("#44403c").font("Helvetica-Bold").text(`${label}: `, { continued: true });
      doc.font("Helvetica").fillColor("#1c1917").text(value || "—");
    };

    section("Sender");
    row("Name", waybill.senderName);
    row("Phone", waybill.senderPhone);
    row("Pickup", waybill.pickupLocation);
    doc.moveDown(0.6);

    section("Receiver");
    row("Name", waybill.receiverName);
    row("Phone", waybill.receiverPhone);
    row("Address", waybill.receiverAddress);
    row("Delivery", waybill.deliveryLocation);
    doc.moveDown(0.6);

    section("Cargo");
    row("Description", waybill.goodsDescription);
    if (waybill.estimatedWeightKg) row("Est. weight", `${waybill.estimatedWeightKg} kg`);
    if (waybill.declaredValueNgn) row("Declared value", `NGN ${Number(waybill.declaredValueNgn).toLocaleString()}`);
    doc.moveDown(0.6);

    row("Date", new Date(waybill.createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" }));
    doc.moveDown(1.0);

    const dashY = doc.y;
    let x = 40;
    while (x < 40 + W) {
      doc.moveTo(x, dashY).lineTo(Math.min(x + 6, 40 + W), dashY).strokeColor("#d6d3d1").lineWidth(0.5).stroke();
      x += 10;
    }
    doc.moveDown(0.5);

    doc.rect(40, doc.y, W, 38).strokeColor("#d6d3d1").lineWidth(0.5).stroke();
    const stubTop = doc.y + 6;
    doc.fontSize(7).fillColor("#78716c").font("Helvetica")
      .text("OPERATOR CLAIM CODE  —  give this to the courier/operator at pickup", 48, stubTop, { width: W - 60 });
    doc.fontSize(18).fillColor("#1c1917").font("Helvetica-Bold")
      .text(waybill.claimToken || "——", 48, stubTop + 12);
    doc.fontSize(7).fillColor("#a8a29e").font("Helvetica")
      .text("Single-use. Enter with waybill number in dashboard to register shipment.", doc.page.width - 180, stubTop + 5, { width: 130, align: "right" });

    doc.moveDown(2.8);
    doc.fontSize(7).fillColor("#a8a29e").font("Helvetica")
      .text("Scan QR to track · Powered by Open Logistics Interconnect (OLI) · trackam.ng", { align: "center" });

    doc.end();
  });
}

module.exports = { requestSenderOtp, verifySenderOtp, generateWaybill, getWaybill, getWaybillByNumber, getOperatorWaybills, claimWaybill, joinLeg, getChain, generatePdf };
