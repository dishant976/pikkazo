# 🔪 Chop Shop Studio — Pikkazo Remix Machine

Paste your wallet (or ENS name) → your Pikkazos land on the chopping table → cut, paint,
animate, and export **MP4 / GIF / PNG** collages. Six 2D blades + an interactive **3D Wall**.
Every still is reproducible from its seed + token list.

---

## Repo layout

```
your-repo/
├── index.html        ← the entire app (frontend)
├── api/
│   └── wallet.js     ← Vercel serverless function (the speed layer)
└── README.md
```

That's it. No build step, no framework, no node_modules.

---

## What is the Alchemy API? (plain words)

Reading a wallet's NFTs directly from Ethereum is slow, because the blockchain has no
"list all NFTs owned by X" button — you have to dig through millions of blocks of
Transfer logs to reconstruct it. Free public RPC nodes let you do this, but they're
rate-limited and it takes a minute or more.

**Alchemy** is a company that runs beefy Ethereum nodes and — crucially — keeps a
**pre-built index** of who owns what, plus **CDN-cached copies of every NFT image**.
Their NFT API answers "what does wallet X own from contract Y?" in **one call, ~1 second**,
images included. The free tier (300M compute units/month) is far more than a community
tool will ever use.

The frontend is smart about it:
- If `api/wallet.js` is deployed → **fast lane** (1 call, ~2s wallet-to-canvas)
- If not → it silently falls back to reading the chain directly through public RPCs
  (works, just slower). So `index.html` alone is still a fully working static site.

## How to place the Alchemy key (3 minutes)

1. **Get a key:** sign up at alchemy.com (free) → *Create new app* → chain: **Ethereum
   Mainnet** → copy the **API key** (the short string, not the full URL).
2. **Give it to Vercel:** your Vercel project → **Settings → Environment Variables** →
   add:
   - Name: `ALCHEMY_API_KEY`
   - Value: *(paste the key)*
   - Environments: Production, Preview, Development
3. **Redeploy** (Deployments → ⋯ → Redeploy). Done — the key lives only on the server.
   It is never shipped to the browser, never visible in page source. `api/wallet.js`
   reads it from `process.env.ALCHEMY_API_KEY` and makes the Alchemy call server-side.

---

## Deploy from zero (once, ~10 minutes)

1. Create a GitHub repo, add the three files above (keep `wallet.js` inside an `api/` folder —
   the folder name is what tells Vercel it's a serverless function).
2. In `index.html`, set the two constants at the top of the `<script>`:
   ```js
   const DEFAULT_CONTRACT = "0x…";   // Pikkazo contract (OpenSea → any item → Details)
   const SITE_URL         = "https://your-app.vercel.app";
   ```
   Once `DEFAULT_CONTRACT` is set, the contract field disappears from the UI — visitors
   see only the wallet box.
3. vercel.com → **Add New Project** → import the repo → Framework preset: **Other** →
   Deploy. (No build command, no output directory — leave defaults.)
4. Add `ALCHEMY_API_KEY` as above, redeploy.
5. Open the site, paste a wallet or `name.eth`, chop.

Pushing to `main` auto-redeploys. That's the whole ops story.

---

## Feature map

| Rack | What it does |
|---|---|
| **Cuts** | GRID STUDIO (paintable grid) · 3D WALL (Three.js tiles) · SHATTER · STRIPS · FACE SPLIT · DIAMOND · WEAVE |
| **Grid controls** | rows/cols (2–12), gap slider, donor brushes (click/drag to paint), INVERT CELL brush, fill-random. Same brushes work in 3D — click a tile and it flips. |
| **Backdrop** | 7 gradients + mat slider (gradient frames the piece; glows through grid gaps) |
| **Finish** | CLEAN / INVERT / NOIR / HEAT / POP / CHAOS (per-fragment random, seed-deterministic) |
| **Motion** | SHUFFLE / DRIFT / PULSE are **toggles — stack them freely**. STILL clears all. Speed slider 0.25×–3×. |
| **Export** | PNG (1200²) · MP4 (MediaRecorder H.264, WebM fallback) · GIF (real encode, offline-rendered frames) · X banner via share flow |

## ENS support

The wallet box accepts `beast.eth` style names. Resolution is done **fully on-chain**
(namehash → ENS registry `resolver()` → resolver `addr()`), verified against the official
EIP-137 test vectors — no third-party name API involved.

## Privacy / trust posture

- Read-only. No wallet connect, no signatures, no transactions — people just type text.
- The Alchemy key never leaves the server. The frontend has zero secrets.
- Every still remix prints its seed; same seed + same tokens = identical output,
  so remixes are verifiable by anyone.

## Troubleshooting

- **Wallet load slow** → the `/api/wallet` route isn't deployed or the env var is missing;
  check Vercel → Functions logs. The app tells you nothing is broken because the
  on-chain fallback still works.
- **MP4 button saves .webm** → that browser can't encode MP4 (some Firefox builds);
  the file still uploads fine to X.
- **3D WALL falls back to flat grid** → the Three.js CDN was unreachable; refresh.
