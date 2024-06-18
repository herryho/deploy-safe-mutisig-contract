// 这个脚本是用Gnosis Safe的transaction servcie url来与多签合约交互。但BSC链只有主网有这个服务，测试网没有。

import * as dotenv from 'dotenv';
import Safe from '@safe-global/protocol-kit';
import SafeApiKit from '@safe-global/api-kit';
import { OperationType, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types';
import { ethers } from 'ethers';
import hre from 'hardhat';
import { transferConfigTestnet, transferConfigMainnet } from '../hardhat.config';

dotenv.config();

async function main() {
  const networkName = hre.network.name;
  const chainId = hre.network.config.chainId!;
  const deployerPrivateKey = process.env.DEPLOYER_ADDRESS_PRIVATE_KEY!;

  let rpcUrl;
  let transferConfig;
  let safeAddress;
  if (networkName === 'bscTestnet') {
    rpcUrl = process.env.BSC_TESTNET_RPC_URL!;
    transferConfig = transferConfigTestnet;
    safeAddress = process.env.SAFE_ADDRESS_TESTNET!;
  } else if (networkName === 'bscMainnet') {
    rpcUrl = process.env.BSC_MAINNET_RPC_URL!;
    transferConfig = transferConfigMainnet;
    safeAddress = process.env.SAFE_ADDRESS_MAINNET!;
  } else {
    throw new Error(`Unsupported network: ${networkName}`);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(deployerPrivateKey, provider);

  // Create Safe instance
  const protocolKit = await Safe.init({
    provider: rpcUrl,
    signer: deployerPrivateKey,
    safeAddress: safeAddress
  });

  // Create Safe API Kit instance
  const apiKit = new SafeApiKit({
    txServiceUrl: transferConfig.txServiceUrl,
    chainId: BigInt(chainId)
  });

  // Create transaction
  const safeTransactionData: SafeTransactionDataPartial = {
    // 收款地址
    to: transferConfig.to,
    value: transferConfig.value,
    data: transferConfig.data,
    operation: OperationType.Call
  };
  const safeTransaction = await protocolKit.createTransaction({
    transactions: [safeTransactionData]
  });

  const signerAddress = signer.address;
  const safeTxHash = await protocolKit.getTransactionHash(safeTransaction);
  const signature = await protocolKit.signHash(safeTxHash);

  // Propose transaction to the service
  await apiKit.proposeTransaction({
    safeAddress: safeAddress,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: signerAddress,
    senderSignature: signature.data
  });

  console.log('Proposed a transaction with Safe:', safeAddress);
  console.log('- safeTxHash:', safeTxHash);
  console.log('- Sender:', signerAddress);
  console.log('- Sender signature:', signature.data);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
