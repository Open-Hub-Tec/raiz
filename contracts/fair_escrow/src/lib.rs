#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env,
    String, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum EscrowError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    EscrowAlreadyExists = 3,
    EscrowNotFound = 4,
    InvalidStatus = 5,
    Unauthorized = 6,
    AmountMismatch = 7,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum EscrowStatus {
    Locked = 0,
    ReleasedToProducer = 1,
    RefundedToBuyer = 2,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowOrder {
    pub lot_code: String,
    pub buyer: Address,
    pub producer: Address,
    pub inspector: Address, // TecNM verifying node
    pub token: Address,     // Stable asset address (USDC or MXN-e)
    pub amount: i128,
    pub status: EscrowStatus,
    pub created_at: u64,
    pub resolved_at: u64,
}

#[contracttype]
pub enum DataKey {
    Escrow(String),
}

const ESCROW_TOPIC: Symbol = symbol_short!("ESCROW");

#[contract]
pub struct FairEscrowContract;

#[contractimpl]
impl FairEscrowContract {
    /// Lock funds in escrow for an agricultural or craft lot order
    pub fn lock_payment(
        env: Env,
        buyer: Address,
        producer: Address,
        inspector: Address,
        token: Address,
        lot_code: String,
        amount: i128,
    ) -> Result<(), EscrowError> {
        buyer.require_auth();

        let key = DataKey::Escrow(lot_code.clone());
        if env.storage().persistent().has(&key) {
            return Err(EscrowError::EscrowAlreadyExists);
        }

        // Transfer funds from buyer to this contract
        let client = token::Client::new(&env, &token);
        client.transfer(&buyer, &env.current_contract_address(), &amount);

        let order = EscrowOrder {
            lot_code: lot_code.clone(),
            buyer,
            producer,
            inspector,
            token,
            amount,
            status: EscrowStatus::Locked,
            created_at: env.ledger().timestamp(),
            resolved_at: 0,
        };

        env.storage().persistent().set(&key, &order);
        env.events().publish((ESCROW_TOPIC, symbol_short!("LOCKED"), lot_code), amount);

        Ok(())
    }

    /// Released to producer upon quality certification at rural weighing station
    pub fn release_funds(env: Env, inspector: Address, lot_code: String) -> Result<(), EscrowError> {
        inspector.require_auth();

        let key = DataKey::Escrow(lot_code.clone());
        let mut order: EscrowOrder = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(EscrowError::EscrowNotFound)?;

        if order.inspector != inspector {
            return Err(EscrowError::Unauthorized);
        }

        if order.status != EscrowStatus::Locked {
            return Err(EscrowError::InvalidStatus);
        }

        order.status = EscrowStatus::ReleasedToProducer;
        order.resolved_at = env.ledger().timestamp();

        let client = token::Client::new(&env, &order.token);
        client.transfer(&env.current_contract_address(), &order.producer, &order.amount);

        env.storage().persistent().set(&key, &order);
        env.events().publish((ESCROW_TOPIC, symbol_short!("RELEASED"), lot_code), order.amount);

        Ok(())
    }

    /// Query state of an escrow
    pub fn get_escrow(env: Env, lot_code: String) -> Result<EscrowOrder, EscrowError> {
        let key = DataKey::Escrow(lot_code);
        env.storage().persistent().get(&key).ok_or(EscrowError::EscrowNotFound)
    }
}
