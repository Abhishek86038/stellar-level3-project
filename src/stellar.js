import { Server } from "@stellar/stellar-sdk/horizon";
import { Networks, TransactionBuilder, Operation, Asset, Keypair } from "@stellar/stellar-sdk";
import { getPublicKey, signTransaction, isConnected } from "@stellar/freighter-api";

const server = new Server("https://horizon-testnet.stellar.org");

export const connectWallet = async () => {
  if (await isConnected()) {
    const publicKey = await getPublicKey();
    return publicKey;
  }
  throw new Error("Freighter wallet is not installed or not connected.");
};

export const getBalance = async (publicKey) => {
  const account = await server.loadAccount(publicKey);
  const balance = account.balances.find((b) => b.asset_type === "native");
  return balance ? balance.balance : "0";
};

export const sendPayment = async (destination, amount, publicKey) => {
  const sourceAccount = await server.loadAccount(publicKey);
  const fee = await server.fetchBaseFee();

  const transaction = new TransactionBuilder(sourceAccount, {
    fee,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset: Asset.native(),
        amount: amount.toString(),
      })
    )
    .setTimeout(180)
    .build();

  const xdr = transaction.toXDR();
  const signedXdr = await signTransaction(xdr, { networkPassphrase: Networks.TESTNET });
  
  // Reconstruct transaction from signed XDR and submit
  const transactionToSubmit = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  const response = await server.submitTransaction(transactionToSubmit);
  
  return response;
};
