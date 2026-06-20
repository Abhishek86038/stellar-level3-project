import { Contract, rpc as SorobanRpc, TransactionBuilder, Networks, nativeToScVal, scValToNative } from "@stellar/stellar-sdk";
import { kit } from "./stellar";
import { CONTRACT_ADDRESS as STORAGE_CONTRACT_ADDRESS } from './contract';

const rpcServer = new SorobanRpc.Server("https://soroban-testnet.stellar.org");
export const PAYMENT_CONTRACT_ADDRESS = "CAC75NNARRWQXNJK2NI22JQF3KV2NJY2VYYRYHYXFHNH66VDDNYXU727";

export const initPaymentContract = () => {
    return new Contract(PAYMENT_CONTRACT_ADDRESS);
};

export const recordPayment = async (sender, receiver, amount, publicKey) => {
    const sourceAccount = await rpcServer.getAccount(publicKey);
    
    const senderVal = nativeToScVal(sender, { type: 'address' });
    const receiverVal = nativeToScVal(receiver, { type: 'address' });
    const amountVal = nativeToScVal(Number(amount), { type: 'i128' });
    const storageContractVal = nativeToScVal(STORAGE_CONTRACT_ADDRESS, { type: 'address' });

    const contract = initPaymentContract();
    
    let transaction = new TransactionBuilder(sourceAccount, {
        fee: "5000", 
        networkPassphrase: Networks.TESTNET,
    })
    .addOperation(contract.call("record_payment", senderVal, receiverVal, amountVal, storageContractVal))
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

export const getPaymentCount = async (address) => {
    const addressVal = nativeToScVal(address, { type: 'address' });
    const contract = initPaymentContract();
    
    const source = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
    const account = new SorobanRpc.Account(source, "0");
    const transaction = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: Networks.TESTNET,
    })
    .addOperation(contract.call("get_payment_count", addressVal))
    .setTimeout(30)
    .build();
    
    const res = await rpcServer.simulateTransaction(transaction);
    if (res.error) throw new Error(res.error);
    if (!res.results || res.results.length === 0) return 0;
    
    return scValToNative(res.results[0].retval);
};

export const getPaymentHistory = async (address) => {
    const addressVal = nativeToScVal(address, { type: 'address' });
    const contract = initPaymentContract();
    
    const source = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
    const account = new SorobanRpc.Account(source, "0");
    const transaction = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: Networks.TESTNET,
    })
    .addOperation(contract.call("get_payment_history", addressVal))
    .setTimeout(30)
    .build();
    
    const res = await rpcServer.simulateTransaction(transaction);
    if (res.error) throw new Error(res.error);
    if (!res.results || res.results.length === 0) return [];
    
    return scValToNative(res.results[0].retval);
};

export const listenForPaymentEvents = async (callback) => {
    try {
        if (PAYMENT_CONTRACT_ADDRESS === "PLACEHOLDER") return;
        const currentLedger = await rpcServer.getLatestLedger();
        let lastLedger = currentLedger.sequence;
        
        setInterval(async () => {
            try {
                const latest = await rpcServer.getLatestLedger();
                if (latest.sequence > lastLedger) {
                    const response = await rpcServer.getEvents({
                        startLedger: lastLedger + 1,
                        filters: [
                            {
                                type: "contract",
                                contractIds: [PAYMENT_CONTRACT_ADDRESS],
                            }
                        ],
                        pagination: { limit: 10 }
                    });
                    
                    if (response.events && response.events.length > 0) {
                        response.events.forEach(event => {
                            callback(event);
                        });
                    }
                    lastLedger = latest.sequence;
                }
            } catch (err) {
                console.error("Error polling events:", err);
            }
        }, 5000);
    } catch (err) {
        console.error("Error initializing event listener:", err);
    }
};
