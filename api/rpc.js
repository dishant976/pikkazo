// api/rpc.js — JSON-RPC proxy through Alchemy
// Fixes the public-RPC CORS/403 problem permanently: the frontend sends all
// eth_call / eth_getLogs / ENS traffic to /api/rpc (same origin, no CORS),
// and this function forwards it to Alchemy's rock-solid node.
//
// Uses the same ALCHEMY_API_KEY env var as api/wallet.js. Nothing else to set up.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET")
    return res.status(200).json({ ok: true, keySet: !!process.env.ALCHEMY_API_KEY });
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const key = process.env.ALCHEMY_API_KEY;
  if (!key) return res.status(500).json({ error: "ALCHEMY_API_KEY not set in Vercel env vars" });

  try {
    const r = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    return res.status(200).json(await r.json());
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
