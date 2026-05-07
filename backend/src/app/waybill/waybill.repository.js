const { query } = require("../../core/db/postgres");

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    waybillNumber: row.waybill_number,
    senderName: row.sender_name,
    senderPhone: row.sender_phone,
    receiverName: row.receiver_name,
    receiverPhone: row.receiver_phone,
    receiverAddress: row.receiver_address,
    goodsDescription: row.goods_description,
    pickupLocation: row.pickup_location,
    deliveryLocation: row.delivery_location,
    estimatedWeightKg: row.estimated_weight_kg ? Number(row.estimated_weight_kg) : null,
    declaredValueNgn: row.declared_value_ngn ? Number(row.declared_value_ngn) : null,
    createdAt: row.created_at,
  };
}

function generateWaybillNumber() {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `WB-${dateStr}-${rand}`;
}

async function create(data) {
  const waybillNumber = generateWaybillNumber();
  const result = await query(
    `INSERT INTO lite_waybills
       (waybill_number, sender_name, sender_phone, receiver_name, receiver_phone,
        receiver_address, goods_description, pickup_location, delivery_location,
        estimated_weight_kg, declared_value_ngn)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      waybillNumber,
      data.senderName, data.senderPhone,
      data.receiverName, data.receiverPhone, data.receiverAddress,
      data.goodsDescription, data.pickupLocation, data.deliveryLocation,
      data.estimatedWeightKg || null, data.declaredValueNgn || null,
    ]
  );
  return mapRow(result.rows[0]);
}

async function getById(id) {
  const result = await query(`SELECT * FROM lite_waybills WHERE id = $1`, [id]);
  return mapRow(result.rows[0]);
}

async function getByNumber(waybillNumber) {
  const result = await query(`SELECT * FROM lite_waybills WHERE waybill_number = $1`, [waybillNumber]);
  return mapRow(result.rows[0]);
}

module.exports = { create, getById, getByNumber };
