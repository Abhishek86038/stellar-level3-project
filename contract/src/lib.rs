#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Symbol};

#[contract]
pub struct SimpleStorage;

#[contractimpl]
impl SimpleStorage {
    pub fn set(env: Env, key: Symbol, value: u64) {
        env.storage().instance().set(&key, &value);
    }

    pub fn get(env: Env, key: Symbol) -> Option<u64> {
        env.storage().instance().get(&key)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{Env, symbol_short};

    #[test]
    fn test_set_and_get_value() {
        let env = Env::default();
        let contract_id = env.register_contract(None, SimpleStorage);
        let client = SimpleStorageClient::new(&env, &contract_id);

        let key = symbol_short!("test_key");
        client.set(&key, &42);

        assert_eq!(client.get(&key), Some(42));
    }

    #[test]
    fn test_get_nonexistent_key() {
        let env = Env::default();
        let contract_id = env.register_contract(None, SimpleStorage);
        let client = SimpleStorageClient::new(&env, &contract_id);

        let key = symbol_short!("missing");
        assert_eq!(client.get(&key), None);
    }
}
