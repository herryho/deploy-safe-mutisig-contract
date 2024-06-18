import * as dotenv from 'dotenv';
import Safe, { EthSafeSignature } from '@safe-global/protocol-kit';
import { ethers } from 'ethers';
import hre from 'hardhat';
import fs from 'fs';

dotenv.config();

function arrayify(hexString:any) {
  if (typeof hexString !== 'string' || !hexString.startsWith('0x')) {
    throw new Error('Invalid hex string');
  }

  hexString = hexString.slice(2);

  if (hexString.length % 2 !== 0) {
    hexString = '0' + hexString;
  }

  const byteArray = new Uint8Array(hexString.length / 2);

  for (let i = 0; i < hexString.length; i += 2) {
    byteArray[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }

  return byteArray;
}

async function approveTransaction() {
  try {
    const networkName = hre.network.name;
    const approverPrivateKey = process.env.APPROVER_ADDRESS_PRIVATE_KEY!;

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

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(approverPrivateKey, provider);

    const safe = await Safe.init({
      provider: rpcUrl,
      signer: approverPrivateKey,
      safeAddress: safeAddress
    });

    const transactionData = JSON.parse(fs.readFileSync('signedSafeTransaction.json', 'utf8'));
    const { signedSafeTransaction, safeTxHash } = transactionData;

    console.log('Approving transaction with Safe:');
    console.log(' - Address: ', await safe.getAddress());
    console.log(' - ChainID: ', await safe.getChainId());
    console.log(' - Transaction Hash: ', safeTxHash);

    if (!safeTxHash) {
      throw new Error('safeTxHash is missing in signedSafeTransaction.');
    }

    await safe.approveTransactionHash(safeTxHash);

    const approverAddress = await signer.getAddress();
    const signatureBytes = arrayify(safeTxHash);
    const signature = await signer.signMessage(signatureBytes);
    console.log('Signature:', signature); // 调试打印签名

    const secondSignature = new EthSafeSignature(approverAddress, signature);
    console.log('Second Signature:', secondSignature); // 调试打印第二个签名

    // 初始化新的签名对象，并添加第二个签名
    const allSignatures = { [secondSignature.signer]: secondSignature.data };

    console.log('All Signatures:', JSON.stringify(allSignatures, null, 2)); // 调试打印所有签名

    console.log('Successfully approved the transaction.');

    fs.writeFileSync('approvedSafeTransaction.json', JSON.stringify({ signedSafeTransaction, signatures: allSignatures, safeTxHash }, null, 2));
  } catch (err) {
    console.log('`approveTransaction` failed:');
    console.error(err);
  }
}

approveTransaction().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
