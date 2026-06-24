#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentRecord {
    pub sender: Address,
    pub receiver: Address,
    pub amount: i128,
    pub timestamp: u64,
    pub category: Symbol,
}

#[contracttype]
pub enum DataKey {
    PaymentCount(Address),
    PaymentHistory(Address),
    CategoryTotal(Address, Symbol),
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
        category: Symbol,
    ) {
        sender.require_auth();

        let timestamp = env.ledger().timestamp();
        let record = PaymentRecord {
            sender: sender.clone(),
            receiver: receiver.clone(),
            amount,
            timestamp,
            category: category.clone(),
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

        // Update category total
        let category_key = DataKey::CategoryTotal(sender.clone(), category.clone());
        let mut category_total: i128 = env.storage().persistent().get(&category_key).unwrap_or(0);
        category_total += amount;
        env.storage().persistent().set(&category_key, &category_total);

        // Emit Event
        env.events().publish(
            (symbol_short!("payment"), sender.clone(), receiver.clone(), category.clone()),
            amount,
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

    pub fn get_total_by_category(env: Env, address: Address, category: Symbol) -> i128 {
        let category_key = DataKey::CategoryTotal(address, category);
        env.storage().persistent().get(&category_key).unwrap_or(0)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::{Address as _, Events}, Env, vec, symbol_short};

    #[test]
    fn test_record_payment() {
        let env = Env::default();
        env.mock_all_auths();
        
        let contract_id = env.register_contract(None, PaymentTracker);
        let client = PaymentTrackerClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let category = symbol_short!("Rent");
        
        client.record_payment(&sender, &receiver, &100, &category);
        
        // Verify event
        let events = env.events().all();
        assert_eq!(events.len(), 1);
        
        // Verify payment count
        assert_eq!(client.get_payment_count(&sender), 1);
        
        // Verify history
        let history = client.get_payment_history(&sender);
        assert_eq!(history.len(), 1);
        assert_eq!(history.get(0).unwrap().amount, 100);
        assert_eq!(history.get(0).unwrap().category, category);

        // Verify category total
        assert_eq!(client.get_total_by_category(&sender, &category), 100);
    }

    #[test]
    fn test_get_payment_count() {
        let env = Env::default();
        env.mock_all_auths();
        
        let contract_id = env.register_contract(None, PaymentTracker);
        let client = PaymentTrackerClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let category1 = symbol_short!("Rent");
        let category2 = symbol_short!("Food");
        
        assert_eq!(client.get_payment_count(&sender), 0);
        
        client.record_payment(&sender, &receiver, &50, &category1);
        assert_eq!(client.get_payment_count(&sender), 1);
        
        client.record_payment(&sender, &receiver, &25, &category2);
        assert_eq!(client.get_payment_count(&sender), 2);
    }
}
