import dotenv from "dotenv";

// Load .env if present
dotenv.config();

const ENDPOINT = "https://api.jsonbin.io/v3/b/69b5223fb7ec241ddc6950cd/latest";

async function fetchJsonbin(masterKey) {
  const headers = {
    "X-Master-Key": masterKey,
    "Accept": "application/json"
  };

  const res = await fetch(ENDPOINT, { method: "GET", headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed: ${res.status} ${res.statusText} - ${text}`);
  }

  return res.json();
}

async function main() {
  // Prefer environment variable for secrets. Set JSONBIN_MASTER_KEY in .env or pass via CLI --key=...
  const argv = process.argv.slice(2);
  let keyFromArg;
  for (const a of argv) {
    if (a.startsWith("--key=")) keyFromArg = a.split("=")[1];
  }

  const masterKey = keyFromArg || process.env.JSONBIN_MASTER_KEY;

  if (!masterKey) {
    console.error("Missing JSONBIN_MASTER_KEY. Set it in .env or pass --key=<masterKey> on the command line.");
    process.exit(1);
  }

  try {
    const data = await fetchJsonbin(masterKey);
    // Pretty-print the JSON result
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error fetching JSONBin:", err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith("getJsonbin.js")) {
  main();
}

export { fetchJsonbin };
