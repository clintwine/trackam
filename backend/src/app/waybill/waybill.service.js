const repo = require("./waybill.repository");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

const REQUIRED_FIELDS = ["senderName", "senderPhone", "receiverName", "receiverPhone", "receiverAddress", "goodsDescription", "pickupLocation", "deliveryLocation"];

async function generateWaybill(body) {
  for (const field of REQUIRED_FIELDS) {
    if (!body[field]) {
      throw Object.assign(new Error(`${field} is required`), { status: 400 });
    }
  }

  const waybill = await repo.create(body);
  return waybill;
}

async function getWaybill(id) {
  const waybill = await repo.getById(id);
  if (!waybill) throw Object.assign(new Error("Waybill not found"), { status: 404 });
  return waybill;
}

async function generatePdf(waybill, frontendUrl) {
  const trackingUrl = `${frontendUrl}/scan?waybill=${waybill.id}`;
  const qrDataUrl = await QRCode.toDataURL(trackingUrl, { width: 160, margin: 1 });
  const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A5", margins: { top: 40, bottom: 40, left: 40, right: 40 } });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width - 80;

    // Header bar
    doc.rect(40, 40, W, 36).fill("#1c1917");
    doc.fontSize(16).fillColor("#ffffff").font("Helvetica-Bold")
      .text("TRACKAM WAYBILL", 48, 50, { width: W - 120 });
    doc.fontSize(9).fillColor("#d6d3d1")
      .text(waybill.waybillNumber, 48, 67);

    // QR code — top right
    doc.image(qrBuffer, doc.page.width - 100, 44, { width: 72, height: 72 });

    doc.moveDown(2.8);

    // Section helper
    const section = (label) => {
      doc.fontSize(7).fillColor("#78716c").font("Helvetica").text(label.toUpperCase(), { characterSpacing: 0.8 });
      doc.moveDown(0.2);
    };
    const row = (label, value) => {
      doc.fontSize(9).fillColor("#44403c").font("Helvetica-Bold").text(`${label}: `, { continued: true });
      doc.font("Helvetica").fillColor("#1c1917").text(value || "—");
    };

    // Sender
    section("Sender");
    row("Name", waybill.senderName);
    row("Phone", waybill.senderPhone);
    row("Pickup", waybill.pickupLocation);
    doc.moveDown(0.6);

    // Receiver
    section("Receiver");
    row("Name", waybill.receiverName);
    row("Phone", waybill.receiverPhone);
    row("Address", waybill.receiverAddress);
    row("Delivery", waybill.deliveryLocation);
    doc.moveDown(0.6);

    // Goods
    section("Cargo");
    row("Description", waybill.goodsDescription);
    if (waybill.estimatedWeightKg) row("Est. weight", `${waybill.estimatedWeightKg} kg`);
    if (waybill.declaredValueNgn) row("Declared value", `₦${Number(waybill.declaredValueNgn).toLocaleString()}`);
    doc.moveDown(0.6);

    // Date
    row("Date", new Date(waybill.createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" }));
    doc.moveDown(1.2);

    // Divider
    doc.moveTo(40, doc.y).lineTo(40 + W, doc.y).strokeColor("#e7e5e4").stroke();
    doc.moveDown(0.6);

    // Footer
    doc.fontSize(7.5).fillColor("#78716c").font("Helvetica")
      .text("Scan the QR code to track this shipment or initiate a digital handover.", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(7).fillColor("#a8a29e")
      .text("Powered by Open Logistics Interconnect (OLI) · trackam.ng", { align: "center" });

    doc.end();
  });
}

module.exports = { generateWaybill, getWaybill, generatePdf };
