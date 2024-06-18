import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-ethers";
import * as dotenv from "dotenv";

dotenv.config();

// deploy配置
const deploySafeConfigTestnet = {
  owners: ['0xdbF8dAa421530e80A6b03C562fcE5B9950c40a5E',"0x4223934E5303F69f5C2Fca251CaA07C07efB1512", "0xE233eF5B8E5F32a04340eB523A5C5CC70454fE85"],
  threshold: 2, // <SAFE_THRESHOLD>
  saltNonce: '150000',
  safeVersion: '1.3.0'
};

const deploySafeConfigMainnet = {
  owners: ['OWNER_ADDRESS_MAINNET'],
  threshold: 1, // <SAFE_THRESHOLD>
  saltNonce: '150000',
  safeVersion: '1.3.0'
};

// 转账配置
const transferConfigTestnet = {
  txServiceUrl: "https://safe-transaction.binance-testnet.gnosis.io",
  to: '0x4223934E5303F69f5C2Fca251CaA07C07efB1512',
  value: '1000', // 1 wei
  data: '0x'
};

const transferConfigMainnet = {
  txServiceUrl: "https://safe-transaction.bsc.gnosis.io",
  to: "收款地址",
  value: '1', // 1 wei
  data: '0x'
};

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL,
      accounts: [`0x${process.env.DEPLOYER_ADDRESS_PRIVATE_KEY}`],
      chainId: 97
    },
    bscMainnet: {
      url: process.env.BSC_MAINNET_RPC_URL,
      accounts: [`0x${process.env.DEPLOYER_ADDRESS_PRIVATE_KEY}`],
      chainId: 56
    }
  }
};

export default config;
export { deploySafeConfigTestnet, deploySafeConfigMainnet, transferConfigTestnet, transferConfigMainnet };
