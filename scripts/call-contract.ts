import { ethers } from "ethers";
import Safe, { CreateTransactionProps } from "@safe-global/protocol-kit";
import { SafeTransactionDataPartial, SafeVersion } from "@safe-global/safe-core-sdk-types";
import hre from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

interface Config {
  RPC_URL: string;
  DEPLOYER_ADDRESS_PRIVATE_KEY: string;
  DEPLOY_SAFE: {
    OWNERS: string[];
    THRESHOLD: number;
    SALT_NONCE: string;
    SAFE_VERSION: string;
  };
}

const config: Config = {
  RPC_URL: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  DEPLOYER_ADDRESS_PRIVATE_KEY: process.env.DEPLOYER_ADDRESS_PRIVATE_KEY || '',
  DEPLOY_SAFE: {
    OWNERS: ['OWNER_ADDRESS'],
    THRESHOLD: 1, // <SAFE_THRESHOLD>
    SALT_NONCE: '150000',
    SAFE_VERSION: '1.3.0'
  }
};

async function main() {
  const provider = new ethers.JsonRpcProvider(config.RPC_URL);
  const deployerWallet = new ethers.Wallet(config.DEPLOYER_ADDRESS_PRIVATE_KEY, provider);

  const safeAddress = "<DEPLOYED_SAFE_ADDRESS>"; // replace with actual deployed safe address

  const safeSdk = await Safe.init({
    provider: config.RPC_URL,
    signer: config.DEPLOYER_ADDRESS_PRIVATE_KEY,
    safeAddress
  });

  const contractAddress = "<CONTRACT_ADDRESS>"; // replace with actual contract address
  const contractAbi = [
    // replace with the actual ABI of the contract
    "function someFunction(uint256 param) external"
  ];

  const contract = new ethers.Contract(contractAddress, contractAbi, provider);

  const data = contract.interface.encodeFunctionData("someFunction", [42]); // replace with actual function name and parameters

  const transaction: SafeTransactionDataPartial = {
    to: contractAddress,
    value: "0x0",
    data,
    operation: 0 // Call
  };

  const createTransactionProps: CreateTransactionProps = {
    transactions: [transaction]
  };

  const safeTransaction = await safeSdk.createTransaction(createTransactionProps);

  console.log("Safe transaction created:", safeTransaction);

  const txHash = await safeSdk.getTransactionHash(safeTransaction);
  console.log("Transaction hash:", txHash);

  const txResponse = await safeSdk.executeTransaction(safeTransaction);
  console.log("Transaction response:", txResponse);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
