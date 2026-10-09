// Netlify Function: every order is rejected, in style.
const reasons = [
  "Your cart weighs more than the delivery drone's feelings.",
  "Payment rejected: your rupees look suspiciously confident.",
  "Warehouse is on a spiritual retreat.",
  "Item is out of stock in this timeline.",
  "The server read your order and sighed."
];
const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ code: 405, reason: "Use POST. Or prayer." }) };
  let items = 0;
  try { const b = JSON.parse(event.body || "{}"); items = Array.isArray(b.items) ? b.items.length : 0; } catch (e) {}
  return {
    statusCode: 200, headers,
    body: JSON.stringify({
      code: 418,
      reason: reasons[Math.floor(Math.random() * reasons.length)] + ` (${items} item types judged)`,
      certificate: "FK-" + Math.floor(Math.random() * 1e6)
    })
  };
};
