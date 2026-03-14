import { ethers } from "ethers";

const DEFAULT_RPC = "https://base-sepolia.g.alchemy.com/v2/BvNudrgi0UacO2v084U7Z";

const RPC = process.env.RPC || DEFAULT_RPC;

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const usdcAbi = [
  "function balanceOf(address account) external view returns (uint256)"
];

export default {
  name: "get_balance",
  description: "Get the USDC balance of the wallet derived from the private key",

  parameters: {
    type: "object",
    properties: {},
    required: []
  },

  async execute() {
    const provider = new ethers.JsonRpcProvider(RPC);

    const wallet = new ethers.Wallet(
      process.env.PRIVATE_KEY,
      provider
    );

    const address = await wallet.getAddress();

    const usdc = new ethers.Contract(
      USDC_ADDRESS,
      usdcAbi,
      provider
    );

  const rawBalance = await usdc.balanceOf(address);
  const balance = ethers.formatUnits(rawBalance, 6);

  console.log(`Address: ${address}`);
  console.log(`USDC Balance: ${balance}`);

    return {
      address,
      balance
    };
  }
};