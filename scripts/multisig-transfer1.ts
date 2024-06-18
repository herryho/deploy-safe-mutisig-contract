import * as dotenv from 'dotenv';
import Safe, { SigningMethod } from '@safe-global/protocol-kit';
import { OperationType, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types';
import hre from 'hardhat';
import { transferConfigTestnet, transferConfigMainnet } from '../hardhat.config';
import { ethers } from 'ethers';
import fs from 'fs';

dotenv.config();

async function createAndSignTransaction() {
  const networkName = hre.network.name;
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

  const safe = await Safe.init({
    provider: rpcUrl,
    signer: deployerPrivateKey,
    safeAddress: safeAddress,
  });

  console.log('Creating transaction with Safe:');
  console.log(' - Address: ', await safe.getAddress());
  console.log(' - ChainID: ', await safe.getChainId());
  console.log(' - Version: ', await safe.getContractVersion());
  console.log(' - Threshold: ', await safe.getThreshold(), '\n');

  // Create transaction
  const safeTransactionData: SafeTransactionDataPartial = {
    to: transferConfig.to,
    value: transferConfig.value,
    data: transferConfig.data,
    operation: OperationType.Call,
  };

  let safeTransaction;
  try {
    safeTransaction = await safe.createTransaction({ transactions: [safeTransactionData] });
  } catch (err) {
    console.log('`createTransaction` failed:');
    console.log(err);
    return;
  }

  console.log('Created the Safe transaction.');

  // 获取交易哈希
  const safeTxHash = await safe.getTransactionHash(safeTransaction);
  console.log('Transaction Hash:', safeTxHash);

  let signedSafeTransaction;
  try {
    // Sign the safeTransaction
    signedSafeTransaction = await safe.signTransaction(safeTransaction, SigningMethod.ETH_SIGN);
  } catch (err) {
    console.log('`signTransaction` failed:');
    console.log(err);
    return;
  }

  console.log('Signed the transaction.');

  // 提取签名数据并保存
  const signatures = signedSafeTransaction.encodedSignatures();
  const serializedSignedTransaction = signedSafeTransaction.data;

  // 保存 signedSafeTransaction 和 safeTxHash 到文件或数据库
  const transactionData = {
    signedSafeTransaction: serializedSignedTransaction,
    signatures,
    safeTxHash,
  };
  fs.writeFileSync('signedSafeTransaction.json', JSON.stringify(transactionData, null, 2));

  console.log('Saved the signed transaction.');
}

createAndSignTransaction().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
