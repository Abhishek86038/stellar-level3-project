import { Contract, rpc as SorobanRpc, TransactionBuilder, Networks, nativeToScVal, scValToNative } from "@stellar/stellar-sdk";
import { kit } from "./stellar";

const rpcServer = new SorobanRpc.Server("https://soroban-testnet.stellar.org");
export const CONTRACT_ADDRESS = "CCXXO7A4IWIWSRUD7WHDBREXKQPVDFDLS3BRVB4DC3ADKBEIKRWHM47Z";

export const initContract = () => {
    return new Contract(CONTRACT_ADDRESS);
};

export const setContractValue = async (key, value, publicKey) => {
    const sourceAccount = await rpcServer.getAccount(publicKey);
    
    // contract call args
    const keyVal = nativeToScVal(key, { type: 'symbol' });
    const valVal = nativeToScVal(Number(value), { type: 'u64' });

    const contract = initContract();
    
    let transaction = new TransactionBuilder(sourceAccount, {
        fee: "1000",
        networkPassphrase: Networks.TESTNET,
    })
    .addOperation(contract.call("set", keyVal, valVal))
    .setTimeout(180)
    .build();

    const preparedTransaction = await rpcServer.prepareTransaction(transaction);
    
    const signedXdr = await kit.signTransaction(preparedTransaction.toXDR(), { networkPassphrase: Networks.TESTNET });
    let txToSubmit;
    if (typeof signedXdr === 'string') {
        txToSubmit = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
    } else {
        txToSubmit = TransactionBuilder.fromXDR(signedXdr.signedTxXdr || signedXdr.xdr, Networks.TESTNET);
    }
    
    const response = await rpcServer.sendTransaction(txToSubmit);
    if (response.status === "ERROR") {
        throw new Error(response.errorResultXdr || "Transaction failed");
    }

    // Wait for the transaction to complete
    let txResponse = await rpcServer.getTransaction(response.hash);
    while (txResponse.status === "NOT_FOUND") {
        await new Promise(resolve => setTimeout(resolve, 2000));
        txResponse = await rpcServer.getTransaction(response.hash);
    }
    
    if (txResponse.status === "FAILED") {
        throw new Error("Contract call failed on network");
    }

    return response;
};

export const getContractValue = async (key) => {
    const keyVal = nativeToScVal(key, { type: 'symbol' });
    const contract = initContract();
    
    // simulated transaction for getting value without signing
    const source = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"; // arbitrary
    const account = new SorobanRpc.Account(source, "0");
    const transaction = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: Networks.TESTNET,
    })
    .addOperation(contract.call("get", keyVal))
    .setTimeout(30)
    .build();
    
    const res = await rpcServer.simulateTransaction(transaction);
    if (res.error) {
        throw new Error(res.error);
    }
    if (!res.results || res.results.length === 0) {
        throw new Error("No result from contract");
    }
    const resultVal = res.results[0].retval;
    return scValToNative(resultVal);
};
