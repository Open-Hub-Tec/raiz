# 📄 Carta de Apelación para Drips / Stellar Wave Program
**Para:** Drips Review Committee & Stellar Wave Program Organizers  
**Repositorio:** `Open-Hub-Tec/raiz`  
**Institución:** Instituto Tecnológico de Tlaxiaco (TecNM), Oaxaca, México  
**Contacto oficial:** `tecnologicotlaxiaco@gmail.com`  

---

## 📌 Contexto de la Apelación (Appeal Statement)

Dear Drips and Stellar Wave Program Evaluation Team,

We respectfully submit this appeal regarding the evaluation of repository **`Open-Hub-Tec/raiz`**. 

Over the past weeks, our engineering faculty and undergraduate indigenous students at **Instituto Tecnológico de Tlaxiaco** have made substantial architectural and code-level contributions directly rooted in the **Stellar & Soroban ecosystem**.

Raíz is not a generic web application; it is an **Open-Source Digital Public Good (MIT)** bringing Real-World Asset (RWA) agricultural traceability, zero-friction rural UX, and fair financial escrow to indigenous smallholder farmers (coffee, honey, pulque) and artisans in the high mountains of Oaxaca, Mexico.

---

## 🛠️ Mejoras y Sustancia Técnica Implementada (Key Improvements Made)

1. **Native Soroban Smart Contracts (Rust) in `/contracts`:**
   - **`LotPassportContract` (`contracts/lot_passport/src/lib.rs`)**: Smart contract deployed to manage immutable harvest credentials, storing SHA-256 hashes of crop photos, certified kilograms, and laboratory inspection scores on-chain.
   - **`FairEscrowContract` (`contracts/fair_escrow/src/lib.rs`)**: Programmable escrow contract locking stablecoin funds (USDC / MXN-e) from buyers and automatically releasing payments to rural smallholders upon quality verification.

2. **Zero-Gas Fee-Bump Sponsorship Architecture:**
   - Designed institutional fee-sponsorship so indigenous elders never pay network fees or handle raw crypto tokens.

3. **Field-Proven Rural UX (Offline Parcel Mode):**
   - Implemented an **Offline-First PWA** architecture where farmers deep in the mountain parcels (without cellular coverage) record harvest data and voice notes in **Tu'un Savi (Mixteco)** locally, auto-syncing to Stellar upon reconnection.

4. **Physical Provenance & Anti-Counterfeiting:**
   - Printable cryptographic QR hang-tags for sacks and artisan textiles linking physical goods directly to on-chain Soroban passports.

5. **Student & Community Empowerment:**
   - 100% conceived and maintained by indigenous students from farming families at a public technical university in Oaxaca, fulfilling the exact mission of Drips public goods funding.

---

## 🔗 Enlaces para Verificación:
- **GitHub Repository:** `https://github.com/Open-Hub-Tec/raiz`
- **Soroban Contracts Directory:** `https://github.com/Open-Hub-Tec/raiz/tree/main/contracts`
- **Live Interactive Demo:** `https://ais-dev-oz33zstal3h64mvd2dn5ng-283290758794.us-east1.run.app`
- **Technical Architecture Spec:** `https://github.com/Open-Hub-Tec/raiz/blob/main/ARQUITECTURA_TECNICA.md`

We kindly invite the Drips team to re-review our repository. We are actively pushing commits and preparing our delegation for **Stellar Meridian in Lisbon**.

Thank you for supporting genuine public goods in Latin America.
