#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env,
    String, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    LotNotFound = 4,
    LotAlreadyExists = 5,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LotPassport {
    pub code: String,
    pub producer_name: String,
    pub location: String,
    pub category: String, // e.g., "Cafe de Especialidad", "Miel de Abeja", "Textil en Telar"
    pub variety: String,
    pub volume_units: u64, // kilograms or craft items
    pub photo_hash: BytesN<32>, // SHA-256 hash of immutable photo asset
    pub lab_cert_hash: BytesN<32>, // SHA-256 hash of TecNM lab assay / inspection
    pub certification_score: u32, // SCAA cup score * 100 or Quality grade
    pub registered_at: u64,
    pub certified: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Lot(String),
}

const LOT_TAG: Symbol = symbol_short!("LOT_REG");

#[contract]
pub struct LotPassportContract;

#[contractimpl]
impl LotPassportContract {
    /// Initialize the contract with an administrative institution (TecNM node address)
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Register a new agricultural or artisanal lot by the authorized certifying node
    pub fn register_lot(
        env: Env,
        caller: Address,
        code: String,
        producer_name: String,
        location: String,
        category: String,
        variety: String,
        volume_units: u64,
        photo_hash: BytesN<32>,
        lab_cert_hash: BytesN<32>,
        certification_score: u32,
    ) -> Result<(), Error> {
        caller.require_auth();

        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;

        if caller != admin {
            return Err(Error::Unauthorized);
        }

        let key = DataKey::Lot(code.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::LotAlreadyExists);
        }

        let timestamp = env.ledger().timestamp();

        let passport = LotPassport {
            code: code.clone(),
            producer_name,
            location,
            category,
            variety,
            volume_units,
            photo_hash,
            lab_cert_hash,
            certification_score,
            registered_at: timestamp,
            certified: true,
        };

        env.storage().persistent().set(&key, &passport);

        // Emit Soroban event for indexing by client & indexer nodes
        env.events().publish((LOT_TAG, code), timestamp);

        Ok(())
    }

    /// Public query to fetch the immutable passport of a lot by folio code
    pub fn get_lot(env: Env, code: String) -> Result<LotPassport, Error> {
        let key = DataKey::Lot(code);
        env.storage().persistent().get(&key).ok_or(Error::LotNotFound)
    }
}
