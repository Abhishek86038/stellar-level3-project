#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec, IntoVal};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentRecord {
    pub sender: Address,
    pub receiver: Address,
    pub amount: i128,
    pub timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    PaymentCount(Address),
    PaymentHistory(Address),
}

#[contract]
pub struct PaymentTracker;

#[contractimpl]
impl PaymentTracker {
    pub fn record_payment(
        env: Env,
        sender: Address,
        receiver: Address,
        amount: i128,
        storage_contract: Address,
    ) {
        sender.require_auth();

        let timestamp = env.ledger().timestamp();
        let record = PaymentRecord {
            sender: sender.clone(),
            receiver: receiver.clone(),
            amount,
            timestamp,
        };

        // Update count
        let count_key = DataKey::PaymentCount(sender.clone());
        let mut count: u32 = env.storage().persistent().get(&count_key).unwrap_or(0);
        count += 1;
        env.storage().persistent().set(&count_key, &count);

        // Update history
        let history_key = DataKey::PaymentHistory(sender.clone());
        let mut history: Vec<PaymentRecord> = env.storage().persistent().get(&history_key).unwrap_or(Vec::new(&env));
        history.push_back(record.clone());
        env.storage().persistent().set(&history_key, &history);

        // Emit Event
        env.events().publish(
            (symbol_short!("payment"), sender.clone(), receiver.clone()),
            amount,
        );

        // Cross-contract call to SimpleStorage.set
        let key = symbol_short!("last_pay");
        let _res: () = env.invoke_contract(
            &storage_contract,
            &symbol_short!("set"),
            (key, amount as u64).into_val(&env),
        );
    }

    pub fn get_payment_count(env: Env, address: Address) -> u32 {
        let count_key = DataKey::PaymentCount(address);
        env.storage().persistent().get(&count_key).unwrap_or(0)
    }

    pub fn get_payment_history(env: Env, address: Address) -> Vec<PaymentRecord> {
        let history_key = DataKey::PaymentHistory(address);
        env.storage().persistent().get(&history_key).unwrap_or(Vec::new(&env))
    }
}
