const { ethers } = require("ethers");
const { SafeFactory, EthersAdapter } = require("@gnosis.pm/safe-core-sdk");
const { SafeServiceClient } = require("@safe-global/api-kit");
require("dotenv").config();

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.BSC_TESTNET_RPC_URL
  );
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const ethAdapter = new EthersAdapter({ ethers, signer: wallet });
  const safeFactory = await SafeFactory.create({ ethAdapter });

  const owners = ["0xYourOwnerAddress1", "0xYourOwnerAddress2"];
  const threshold = 2;

  const safeAccountConfig = { owners, threshold };
  const safe = await safeFactory.deploySafe({ safeAccountConfig });

  console.log("Gnosis Safe deployed at:", await safe.getAddress());

  const serviceClient = new SafeServiceClient({
    txServiceUrl: process.env.BSC_TESTNET_SERVICE_URL,
    ethAdapter,
  });

  const safeAddress = await safe.getAddress();
  const safeTransactionData = {
    to: safeAddress,
    value: "0",
    data: "0x",
    operation: 0,
    safeTxGas: 0,
    baseGas: 0,
    gasPrice: 0,
    gasToken: ethers.constants.AddressZero,
    refundReceiver: ethers.constants.AddressZero,
    nonce: await safe.getNonce(),
  };

  await serviceClient.proposeTransaction({
    safeAddress,
    safeTransactionData,
    safeTxHash: await safe.getTransactionHash(safeTransactionData),
    senderAddress: wallet.address,
    senderSignature: "0x",
  });
}

main().catch(console.error);
