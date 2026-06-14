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
