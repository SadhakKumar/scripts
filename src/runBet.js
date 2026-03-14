import dotenv from "dotenv";
import placeBet from "./place_bet.js";

dotenv.config();

function parseAmountFromArgs() {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--amount=")) {
      return Number(a.split("=")[1]);
    }
    if (a === "--amount" && argv[i + 1]) {
      return Number(argv[i + 1]);
    }
  }
  if (process.env.AMOUNT) return Number(process.env.AMOUNT);
  return undefined;
}

async function main() {
  const amount = parseAmountFromArgs();

  if (!process.env.PRIVATE_KEY) {
    console.error("Missing PRIVATE_KEY in environment. Copy .env.example -> .env and set PRIVATE_KEY.");
    process.exit(1);
  }

  if (!amount || Number.isNaN(amount) || amount <= 0) {
    console.error("Missing or invalid amount. Pass --amount=<number> or set AMOUNT in .env.");
    process.exit(1);
  }

  console.log(`Using RPC: ${process.env.RPC || "https://sepolia.base.org"}`);
  console.log(`Placing a bet of ${amount} USDC`);

  try {
    const res = await placeBet.execute({ amount });
    console.log("Done:", res);
  } catch (err) {
    console.error("Error placing bet:", err);
    process.exit(1);
  }
}

main();
