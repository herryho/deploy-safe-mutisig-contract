import { SafeAccountConfig, SafeFactory } from "@safe-global/protocol-kit";
import { SafeVersion } from "@safe-global/safe-core-sdk-types";
import hre from 'hardhat';
import * as dotenv from 'dotenv';
import { deploySafeConfigTestnet, deploySafeConfigMainnet } from '../hardhat.config';

dotenv.config();

async function main() {
  const deployerPrivateKey = process.env.DEPLOYER_ADDRESS_PRIVATE_KEY!;
  const networkName = hre.network.name;

  let deploySafeConfig;
  let rpcUrl;

  if (networkName === 'bscTestnet') {
    deploySafeConfig = deploySafeConfigTestnet;
    rpcUrl = process.env.BSC_TESTNET_RPC_URL!;
  } else if (networkName === 'bscMainnet') {
    deploySafeConfig = deploySafeConfigMainnet;
    rpcUrl = process.env.BSC_MAINNET_RPC_URL!;
  } else {
    throw new Error(`Unsupported network: ${networkName}`);
  }

  const safeVersion = deploySafeConfig.safeVersion as SafeVersion;
  console.log('Safe config: ', deploySafeConfig);

  // Create SafeFactory instance
  const safeFactory = await SafeFactory.init({
    provider: rpcUrl,
    signer: deployerPrivateKey,
    safeVersion
  });

  // Config of the deployed Safe
  const safeAccountConfig: SafeAccountConfig = {
    owners: deploySafeConfig.owners,
    threshold: deploySafeConfig.threshold
  };
  const saltNonce = deploySafeConfig.saltNonce;

  // Predict deployed address
  const predictedDeploySafeAddress = await safeFactory.predictSafeAddress(
    safeAccountConfig,
    saltNonce
  );

  console.log('Predicted deployed Safe address:', predictedDeploySafeAddress);

  function callback(txHash: string) {
    console.log('Transaction hash:', txHash);
  }

  // Deploy Safe
  const safe = await safeFactory.deploySafe({
    safeAccountConfig,
    saltNonce,
    callback
  });

  console.log('Deployed Safe:', await safe.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
