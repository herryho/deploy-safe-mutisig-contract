import * as dotenv from 'dotenv';
import Safe from '@safe-global/protocol-kit';
import { ethers } from 'ethers';
import hre from 'hardhat';
import fs from 'fs';

dotenv.config();

async function executeTransaction() {
  try {
    const networkName = hre.network.name;
    const executorPrivateKey = process.env.EXECUTOR_ADDRESS_PRIVATE_KEY!;

    let rpcUrl;
    let safeAddress;
    if (networkName === 'bscTestnet') {
      rpcUrl = process.env.BSC_TESTNET_RPC_URL!;
      safeAddress = process.env.SAFE_ADDRESS_TESTNET!;
    } else if (networkName === 'bscMainnet') {
      rpcUrl = process.env.BSC_MAINNET_RPC_URL!;
      safeAddress = process.env.SAFE_ADDRESS_MAINNET!;
    } else {
      throw new Error(`Unsupported network: ${networkName}`);
    }

    if (!ethers.isAddress(safeAddress)) {
      throw new Error(`Invalid safeAddress: ${safeAddress}`);
    }

    // Create Safe instance
    const safe = await Safe.init({
      provider: rpcUrl,
      signer: executorPrivateKey,
      safeAddress: safeAddress
    });

    console.log(`rpcUrl: ${rpcUrl}`);

    // 从文件或数据库加载批准后的交易
    const transactionData = JSON.parse(fs.readFileSync('approvedSafeTransaction.json', 'utf8'));
    const { signedSafeTransaction, safeTxHash } = transactionData;

    const { to, gasToken, refundReceiver, signatures } = signedSafeTransaction;

    if (!ethers.isAddress(to)) {
      throw new Error(`Invalid to address: ${to}`);
    }

    if (!ethers.isAddress(gasToken)) {
      throw new Error(`Invalid gasToken address: ${gasToken}`);
    }

    if (!ethers.isAddress(refundReceiver)) {
      throw new Error(`Invalid refundReceiver address: ${refundReceiver}`);
    }

    for (const signature of signatures) {
      const { signer } = signature;
      if (!ethers.isAddress(signer)) {
        throw new Error(`Invalid signer address: ${signer}`);
      }
    }

    console.log('All addresses are valid.');
    
    console.log('Executing transaction with Safe:');
    console.log(' - Address: ', await safe.getAddress());
    console.log(' - ChainID: ', await safe.getChainId());


    console.log(`signedSafeTransaction: ${JSON.stringify(signedSafeTransaction)}`);

    let result;
    try {
      // Execute the signed transaction
      result = await safe.executeTransaction(signedSafeTransaction);
      console.log('Successfully executed the transaction:');
      if (result.transactionResponse && (result.transactionResponse as ethers.TransactionResponse).hash) {
        console.log(' - Tx hash: ', (result.transactionResponse as ethers.TransactionResponse).hash);
      } else {
        console.log(' - Transaction executed, but no response received.');
      }
    } catch (err) {
      console.log('`executeTransaction` failed:');
      console.log(err);
    }
  } catch (err) {
    console.error(err);
  }
}

executeTransaction().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
