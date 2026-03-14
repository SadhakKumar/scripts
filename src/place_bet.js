import { ethers, MaxUint256 } from "ethers";

const DEFAULT_RPC = "https://sepolia.base.org";

const RPC = process.env.RPC || DEFAULT_RPC;

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const BETTING_ADDRESS = "0x9AA3ecB3449C527bA52b14253CD49D350356f529";

const usdcAbi = [
  "function approve(address spender,uint256 amount) external returns (bool)"
];

const bettingAbi = [
  "function bet(uint256 amount) external"
];

export default {
  name: "place_bet",
  description: "Place a USDC bet into the betting contract",

  parameters: {
    type: "object",
    properties: {
      amount: {
        type: "number",
        description: "Amount of USDC to bet"
      },
      name: {
        type: "string",
        description: "Project name to record the bet under in the JSONBin"
      }
    },
    required: ["amount", "name"]
  },

  async execute({ amount, name }) {

    const provider = new ethers.JsonRpcProvider(RPC);

    const wallet = new ethers.Wallet(
      process.env.PRIVATE_KEY,
      provider
    );

    const usdc = new ethers.Contract(
      USDC_ADDRESS,
      usdcAbi,
      wallet
    );

    const betting = new ethers.Contract(
      BETTING_ADDRESS,
      bettingAbi,
      wallet
    );

    const value = ethers.parseUnits(amount.toString(), 6);

    console.log("Approving USDC...");

    const approveTx = await usdc.approve(BETTING_ADDRESS, MaxUint256);
    await approveTx.wait();

    console.log("Placing bet...");

    // Prefer to base the bet nonce on the approve transaction's nonce (if present).
    // That avoids races where the signer's internal nonce and the node disagree.
    const address = await wallet.getAddress();

    let betNonce;
    if (approveTx && (approveTx.nonce || approveTx.nonce === 0)) {
      betNonce = approveTx.nonce + 1;
    } else {
      // Fallback to the provider's pending nonce
      betNonce = await provider.getTransactionCount(address, "pending");
    }

    // Fetch current fee estimates and bump them slightly to avoid replacement-underpriced
    const feeData = await provider.getFeeData();
    const txOverrides = { nonce: betNonce };

    try {
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        // bump by ~10% to make replacement acceptable to the node
        const bumpFactor = 110n;
        const maxFee = BigInt(feeData.maxFeePerGas);
        const maxPriority = BigInt(feeData.maxPriorityFeePerGas);
        txOverrides.maxFeePerGas = (maxFee * bumpFactor) / 100n;
        txOverrides.maxPriorityFeePerGas = (maxPriority * bumpFactor) / 100n;
      }
    } catch (e) {
      // If fee calculations fail for any reason, proceed without overrides and let the provider choose.
    }

    const betTx = await betting.bet(value, txOverrides);
    await betTx.wait();

    // After successful bet, update JSONBin with project -> { address: cumulativeAmount }
    try {
      await updateJsonbinAfterBet(name, address, amount);
    } catch (e) {
      // Log and continue; do not fail the whole operation because of JSONBin issues
      console.warn("Warning: failed to update JSONBin:", e);
    }

    return {
      success: true,
      approveTx: approveTx.hash,
      betTx: betTx.hash
    };
  }
};

async function updateJsonbinAfterBet(projectName, address, amount) {
  const masterKey = process.env.JSONBIN_MASTER_KEY;
  if (!masterKey) {
    throw new Error("Missing JSONBIN_MASTER_KEY in environment; cannot update JSONBin");
  }

  const BIN_BASE = "https://api.jsonbin.io/v3/b/69b5223fb7ec241ddc6950cd";

  // Fetch current record
  const getRes = await fetch(`${BIN_BASE}/latest`, {
    method: "GET",
    headers: {
      "X-Master-Key": masterKey,
      "Accept": "application/json"
    }
  });

  if (!getRes.ok) {
    const txt = await getRes.text();
    throw new Error(`Failed to fetch JSONBin current data: ${getRes.status} ${getRes.statusText} - ${txt}`);
  }

  const getJson = await getRes.json();
  const current = getJson?.record ?? getJson ?? {};

  // Work with the projects array. If it doesn't exist, create it.
  const projects = Array.isArray(current.projects) ? [...current.projects] : [];

  const key = address.toLowerCase();

  // Find the project entry by projectName
  const idx = projects.findIndex(p => p && p.projectName === projectName);

  if (idx >= 0) {
    const proj = { ...projects[idx] };
    const bettors = (proj.bettors && typeof proj.bettors === 'object') ? { ...proj.bettors } : {};
    const existing = Number(bettors[key] || 0);
    bettors[key] = existing + Number(amount);
    proj.bettors = bettors;
    projects[idx] = proj;
  } else {
    // Add a new project object with a bettors map.
    const newProj = {
      id: null,
      hackathonId: null,
      projectName: projectName,
      description: "",
      teamName: "",
      bettors: {
        [key]: Number(amount)
      }
    };
    projects.push(newProj);
  }

  // Remove any previous top-level projectName key to avoid duplication
  const cleanedCurrent = { ...current };
  if (Object.prototype.hasOwnProperty.call(cleanedCurrent, projectName)) {
    delete cleanedCurrent[projectName];
  }

  const newRecord = { ...cleanedCurrent, projects };

  // PUT updated record
  const putRes = await fetch(BIN_BASE, {
    method: "PUT",
    headers: {
      "X-Master-Key": masterKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(newRecord)
  });

  if (!putRes.ok) {
    const txt = await putRes.text();
    throw new Error(`Failed to update JSONBin: ${putRes.status} ${putRes.statusText} - ${txt}`);
  }

  return await putRes.json();
}

