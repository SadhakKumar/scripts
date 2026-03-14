# Betting runner

This small project wires your provided `place_bet` module into a runnable script.

Files added

- `src/place_bet.js` — the betting module you provided (ES module). Uses `ethers@^6`.
- `src/runBet.js` — simple runner: loads `.env`, reads `PRIVATE_KEY`, and calls the module.
- `.env.example` — copy to `.env` and set `PRIVATE_KEY` (and optionally `RPC` / `AMOUNT`).

Usage

1. Copy `.env.example` to `.env` and set `PRIVATE_KEY` (required). Optionally set `RPC` and `AMOUNT`.

2. Install dependencies:

```powershell
npm install
```

3. Run the bet (example placing 10 USDC):

```powershell
npm run bet -- --amount=10
```

Notes

- This uses the default RPC `https://sepolia.base.org` unless you override with `RPC` in `.env`.
- The runner expects USDC with 6 decimals. `amount` is the human-readable USDC amount (e.g. 10).
- Sending real transactions requires a funded account and care. Test on testnets first.
