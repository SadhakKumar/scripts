import dotenv from "dotenv";
import getBalance from "./get_balance.js";

dotenv.config();

async function main() {
  if (!process.env.PRIVATE_KEY) {
    console.error("Missing PRIVATE_KEY in environment. Copy .env.example -> .env and set PRIVATE_KEY.");
    process.exit(1);
  }

  console.log(`Using RPC: ${process.env.RPC || "https://base-sepolia.g.alchemy.com/v2/BvNudrgi0UacO2v084U7Z"}`);

  try {
    const res = await getBalance.execute();
    console.log("Result:", res);
  } catch (err) {
    console.error("Error getting balance:", err);
    process.exit(1);
  }
}

main();
