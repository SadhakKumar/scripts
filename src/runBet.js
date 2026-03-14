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

function parseNameFromArgs() {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--name=")) {
      return a.split("=")[1];
    }
    if (a === "--name" && argv[i + 1]) {
      return argv[i + 1];
    }
  }
  if (process.env.PROJECT_NAME) return process.env.PROJECT_NAME;
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

  const name = parseNameFromArgs();

  if (!name) {
    console.error("Missing project name. Pass --name=<project name> or set PROJECT_NAME in .env.");
    process.exit(1);
  }

  try {
    const res = await placeBet.execute({ amount, name });
    console.log("Done:", res);
  } catch (err) {
    console.error("Error placing bet:", err);
    process.exit(1);
  }
}

main();
