import { ethers } from "ethers";

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
      }
    },
    required: ["amount"]
  },

  async execute({ amount }) {

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

    const approveTx = await usdc.approve(BETTING_ADDRESS, value);
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

    return {
      success: true,
      approveTx: approveTx.hash,
      betTx: betTx.hash
    };
  }
};
