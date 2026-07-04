// api/wallet.js — Vercel serverless function
// One Alchemy call replaces the entire on-chain log dig: ~1s instead of ~60s.
//
// Setup (same as The Grove):
//   1. Put this file at api/wallet.js in the repo root
//   2. Vercel dashboard → Settings → Environment Variables → ALCHEMY_API_KEY
//   3. Redeploy. The frontend auto-detects this route and uses it first.
//
// GET /api/wallet?owner=0x...&contract=0x...
// → { tokens: [{ id: "348", image: "https://nft-cdn.alchemy.com/..." }, ...] }

export default async function handler(req, res) {
  const { owner, contract, health } = req.query;
  const key = process.env.ALCHEMY_API_KEY;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");

  // Open /api/wallet?health=1 in a browser to check the setup
  if (health) return res.status(200).json({ ok: true, keySet: !!key });

  if (!key) return res.status(500).json({ error: "ALCHEMY_API_KEY not set" });
  if (!/^0x[0-9a-fA-F]{40}$/.test(owner || ""))    return res.status(400).json({ error: "bad owner address" });
  if (!/^0x[0-9a-fA-F]{40}$/.test(contract || "")) return res.status(400).json({ error: "bad contract address" });

  try {
    const url =
      `https://eth-mainnet.g.alchemy.com/nft/v3/${key}/getNFTsForOwner` +
      `?owner=${owner}` +
      `&contractAddresses[]=${contract}` +
      `&withMetadata=true&pageSize=24`;

    const r = await fetch(url);
    if (!r.ok) throw new Error(`Alchemy ${r.status}`);
    const data = await r.json();

    const tokens = (data.ownedNfts || []).map((nft) => ({
      id: String(parseInt(nft.tokenId, nft.tokenId.startsWith("0x") ? 16 : 10)),
      image:
        nft.image?.cachedUrl ||
        nft.image?.thumbnailUrl ||
        nft.image?.originalUrl ||
        nft.raw?.metadata?.image ||
        null,
    }));

    return res.status(200).json({ tokens });
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
