const { onRequest } = require("firebase-functions/v2/https");
const reasons = [
  "Your cart weighs more than the delivery drone's feelings.",
  "Payment rejected: your rupees look suspiciously confident.",
  "Warehouse is on a spiritual retreat.",
  "Item is out of stock in this timeline.",
  "The server read your order and sighed."
];
exports.checkout = onRequest({ cors: true }, (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ code: 405, reason: "Use POST. Or prayer." });
  const items = Array.isArray(req.body && req.body.items) ? req.body.items.length : 0;
  res.status(200).json({
    code: 418,
    reason: reasons[Math.floor(Math.random() * reasons.length)] + ` (${items} item types judged)`,
    certificate: "FK-" + Math.floor(Math.random() * 1e6)
  });
});
