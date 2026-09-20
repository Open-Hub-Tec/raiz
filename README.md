<div align="center">

# 🌿 Raíz: Community Origin Traceability & Fair Trade
### *Open Public Infrastructure for Decentralized Traceability, Multimodal AI, and Fair Trade on Stellar for Indigenous Producers*

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Drips: Verified Public Good](https://img.shields.io/badge/Drips-Funded%20Public%20Good-blueviolet.svg)](https://www.drips.network/)
[![Stellar: Built on Horizon & Soroban](https://img.shields.io/badge/Stellar-Soroban%20%7C%20Horizon-black.svg?logo=stellar)](https://stellar.org)
[![Institution: TecNM Campus Tlaxiaco](https://img.shields.io/badge/Development-TecNM%20Tlaxiaco-b45309.svg)](http://tlaxiaco.tecnm.mx/)
[![Status: MVP Pilot Active v1.0](https://img.shields.io/badge/Status-Active%20Pilot%20v1.0-success.svg)]()

<p align="center">
  <b>Conceived and developed by undergraduate engineering students from native indigenous communities at Instituto Tecnológico de Tlaxiaco (Oaxaca, Mexico)</b>
  <br>
  <i>Candidate for continuous public goods funding on <b>Drips Protocol</b> and milestone grants in the <b>Stellar Community Fund (SCF)</b></i>
</p>

[Overview](#-overview) • [Social Impact](#-social-impact--problem-statement) • [System Architecture](#-system-architecture) • [Stellar & Soroban Integration](#-stellar--soroban-integration) • [Roadmap & Milestones](#-development-roadmap--milestones-scf--drips) • [Installation & Setup](#-installation--local-development) • [Team & Governance](#-team--governance)

---

</div>

## 📌 Overview

**Raíz** is an open-source digital public good created to empower smallholder indigenous producers and elderly farmers in the Mixteca Highlands of Oaxaca, Mexico. It bridges rural cooperatives with direct fair-trade global buyers, systematically eliminating extractive intermediaries (*coyotaje*).

By combining **Multimodal Computer Vision AI (Gemini 2.5)** for instant on-field crop quality diagnosis with the **Stellar Network (Horizon & Soroban Smart Contracts)** for cryptographic immutability through a **Digital Origin Passport**, Raíz provides authentic verifiable traceability for **Specialty Parchment Coffee**, **Traditional Maguey Pulque & Aguamiel**, **Wild Honey**, **Native Heirloom Corn**, and **Backstrap Loom Handwoven Textiles**.

### Why Raíz is a Candidate for Drips and Stellar SCF Funding

1. **Radical Technological & Financial Inclusion**: Built specifically for elder adults (60+ years old) and speakers of indigenous languages (Tu'un Savi / Mixteco), featuring conversational voice-assisted guidance (Text-to-Speech), hands-free audio notes, and zero-friction navigation.
2. **True Public Good & Open Source**: 100% open-source under the permissive MIT license, without extractive platform fees or mandatory asset lockups.
3. **Real-World Asset (RWA) Utility on Stellar**: Each validated agricultural lot is anchored on-chain with immutable cryptographic hashes on Stellar Horizon Testnet and Soroban, proving regional origin and chemical/physical compliance.
4. **Indigenous Youth & University Talent Empowerment**: Conceived, engineered, and maintained by undergraduate Computer Systems Engineering students (*Ingeniería en Sistemas Computacionales*) at **TecNM Campus Tlaxiaco** who themselves are native members of the indigenous communities of the Mixteca Highlands (*Ñuu Savi*). They possess direct cultural context, native language fluency (Tu'un Savi / Mixteco), and lived understanding of their families' agricultural realities, generating true regional technological sovereignty.

---

## 🎯 Social Impact & Problem Statement

### The Problem
In the Mixteca Alta region, over 80% of agricultural producers and artisans are elderly smallholders who suffer from:
- **Predatory Intermediaries (*Coyotes*):** Purchasing high-grade coffee beans and artisanal pulque at up to 75% below legitimate market prices due to lack of certification.
- **Digital Literacy Barrier:** Standard web3 and fintech apps impose complex wallet interactions, English terminology, and inaccessible UX patterns.
- **Costly Certification Laboratories:** Traditional food laboratories charge prohibitive fees and require weeks of physical transit to deliver basic quality reports.

### The Raíz Solution
- **Instant AI Vision Evaluation in the Field**: A single smartphone photo of coffee parchment grains, pulque vats (*tinacales*), honey density, or textile weaves is processed by multimodal vision models to verify moisture percentages, pest damage (coffee borer beetle / *broca*), and pure authenticity in seconds.
- **Stellar Digital Origin Passport**: Every approved lot receives an immutable cryptographic seal and QR passport anchored on Stellar that end-consumers can audit worldwide.
- **Fair Direct Settlement**: Buyers purchase directly from producers with transparent settlement and near-zero transaction costs ($0.00001 USD per transaction).

---

## 🏗️ System Architecture

Raíz is engineered as an offline-first, modular architecture cleanly decoupling UI, Domain Core, and External Ledgers:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       CLIENT / PRESENTATION LAYER                       │
│  React 19 + TypeScript + Vite PWA + Tailwind CSS + Lucide Icons         │
│  - Service Worker Offline Caching (Zero-downtime offline launch)        │
│  - Single-view Touch UI (56px touch targets, high sunlight contrast)    │
│  - Oral-First Voice Assistant (Mixteco / Tu'un Savi, Zapoteco, Spanish) │
│  - Elder Accessibility Mode (Aa+ enlarged typography & haptics)         │
│  - QR & NFC Tag Generator for physical bag/garment attestation          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Direct Invocations
┌────────────────────────────────────▼────────────────────────────────────┐
│                  NATIVE DECOUPLED CORE (`src/core/`)                     │
│  Platform-Agnostic Domain Logic (Runs in Web, Mobile, or Node.js)       │
│                                                                         │
│  1. 🔄 SyncEngine (`core/sync/`)                                         │
│     - Outbox Queue with IndexedDB local persistence                     │
│     - Auto-reconnection listener for zero-loss batch syncing             │
│                                                                         │
│  2. 🔐 CryptoEngine (`core/crypto/`)                                     │
│     - SHA-256 Digest generation over audio testimonials & harvest photos │
│     - Canonical community digital passport hashing                      │
│                                                                         │
│  3. ⚖️ FairTradeEngine (`core/policy/`)                                  │
│     - Anti-Coyote Alert Thresholds ($90 MXN coffee, $250 crafts)         │
│     - Automatic 8% producer perpetual royalty & 2% tequio fund calc     │
│                                                                         │
│  4. 🌌 SorobanAdapter (`core/blockchain/`)                              │
│     - Stellar Horizon & Soroban RPC dispatcher                          │
│     - LotPassport & FairEscrow contract bindings                        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
┌───────────────────▼─────────────────┐   ┌───────────▼───────────────────┐
│        MULTIMODAL AI SERVICE        │   │        STELLAR NETWORK        │
│  Google Gemini 2.5 Flash            │   │  Stellar Horizon Testnet      │
│  - Category & specimen detection    │   │  + Soroban Smart Contracts    │
│  - Moisture, pest & defect scoring  │   │  - Immutable lot hash sealing │
│  - Adulterant & purity detection    │   │  - Public audit explorer link │
│  - Mexican Agronomic Norms (NOM)    │   │  - Digital Origin Passport    │
└─────────────────────────────────────┘   └───────────────────────────────┘
```

---

## 🌌 Stellar & Soroban Integration

Raíz utilizes **Stellar Network** for its high throughput, predictable 3–5 second finality, minimal carbon footprint, and fractional fee structure:

### 1. Digital Origin Passport Sealing (Horizon & Soroban)
When a producer submits an AI-verified lot, a canonical metadata payload is generated:

```json
{
  "producer": "Don Pedro Hernández Bautista",
  "community": "San Cristóbal Amoltepec, Mixteca Alta, Oaxaca",
  "product": "Traditional Pulque (Agave Salmiana / Manso)",
  "volume": "120 Liters",
  "qualityScore": 96,
  "timestamp": 1726315200,
  "inspectionHash": "sha256:4a8c9b2f1e0d3c5a7821..."
}
```

This record is permanently anchored via:
- **`manage_data` / `memo_hash`**: On Stellar Horizon transactions for lightweight, costless verification.
- **Soroban Smart Contract (`LotRegistry.rs`)**: Maintains state machines for certification status, community co-op endorsement, and transfer of custody history.

### 2. Perpetual Secondary Royalties for Indigenous Producers (Soroban Smart Contracts)

One of the greatest systemic injustices in agricultural and artisanal supply chains is that **producers capture value only once** at the farmgate or workshop door. When an intermediary or brand resells raw coffee to high-end roasteries for 10x the price, or when an authentic Mixtec handwoven *huipil* is auctioned or resold in luxury galleries for $800+ USD, the original indigenous family receives **$0**.

Raíz breaks this cycle through automated **Perpetual Secondary Royalties** built directly into the Soroban smart contract:
- **Automatic 8% Royalty on Downstream Commercialization:** Every time a certified lot or artisanal piece is resold, repackaged into specialty editions, or auctioned through authorized fair-trade channels, the smart contract automatically deducts **8% of the transaction volume** and routes it straight to the producer's registered wallet.
- **2% Community Safeguarding & Tequio Pool:** An additional **2%** is streamed into the community cooperative fund for collective agricultural tools, local seed preservation, and elderly health mutuals.
- **Anti-Plagiarism & Cultural Attribution:** High-resolution digital weave fingerprints and botanical spectrometry profiles prevent commercial appropriation, ensuring perpetual royalties remain legally anchored to the authentic artisan's lineage.
- **Cash-Friendly Off-ramping:** Royalties accumulated on Stellar are batch-liquidated through local community partners (Banco del Bienestar / Finabien) so non-technical elders receive cash alerts without touching complex DEX interfaces.

### 3. Market Dynamics: Producer Direct Sales vs. Downstream Specialty Resellers

A common question in decentralized agricultural marketplaces is: **How does a downstream buyer/reseller compete if the producer also lists lots directly in the showcase?**

Raíz resolves this through positive-sum economic design and product transformation:
- **Raw Commodity vs. Transformed Value:** The smallholder provides bulk dried pergamino or raw loom fabrics. The specialty reseller adds roasting curves, cupping curation, hermetic nitrogen packaging, urban retail placement, and barista service.
- **Logistics & Immediacy:** Urban consumers pay for same-day delivery and in-store cups in metropolitan centers, while farmgate direct shipments take 4–7 days from the mountains.
- **Positive-Sum Alignment:** The **8% Perpetual Royalty** on Soroban guarantees that whenever the reseller successfully markets lots at premium urban margins, the farming family receives recurring cash streams automatically.
- 📖 **Complete In-Depth Analysis:** Read our dedicated paper: [**Market Dynamics & Incentive Design (`docs/MARKET_DYNAMICS_AND_INCENTIVES.md`)**](./docs/MARKET_DYNAMICS_AND_INCENTIVES.md).

### 4. Fair Trade Settlement Rails (Phase 2 Roadmap)
Integration with **Stellar Anchors (SEP-24 / SEP-38)** to allow global buyers to deposit stablecoins (USDC) while facilitating automated off-ramping to Mexican Pesos (MXN) directly into local credit unions and savings cooperatives (*Cajas Populares*) without predatory foreign exchange fees.

---

## 💧 Drips Protocol Integration (Continuous Public Goods Funding)

**Raíz** is structured to leverage **Drips Protocol** streaming mechanics for long-term open-source sustainability:

- **Transparent Splits Model**: All incoming Drips streams and donations are programmatically routed exclusively to contributors:
  - **80%**: Undergraduate student engineering stipends (Proof of Work based on merged PRs, field validation milestones, and code delivery) at TecNM Campus Tlaxiaco.
  - **20%**: Lead maintainer and technical architecture direction (code reviews, Soroban smart contract architecture, sprint scoping, and student mentorship).
- **Dependency & Open Contribution**: All contract code, documentation, and client modules remain fully public and forkable on GitHub.

---

## 🚀 Development Roadmap & Milestones (SCF & Drips)

### 📍 Milestone 1: Production-Ready MVP & Field Prototype *(Completed)*
- [x] High-contrast, elder-accessible messaging UI with single-touch interaction.
- [x] Dynamic profile engine supporting Coffee, Pulque, Honey, Corn, and Textiles.
- [x] Multimodal AI vision analysis with automated mismatch detection.
- [x] Voice synthesis (TTS) and voice note playback for indigenous elders.
- [x] Simulated Stellar Horizon Testnet audit sealing workflow.
- [x] Open-source codebase under MIT License.

### 📍 Milestone 2: Soroban Contracts, Royalties & Drips Setup *(Current – Drips & SCF Kickoff Target)*
- [ ] Deploy native Soroban smart contract (`LotRegistry.rs`) to Stellar Testnet with automated 8% producer secondary royalty routing.
- [ ] Public audit explorer viewer linking transaction hashes and royalty distribution events to StellarExpert.
- [ ] On-field pilot trial with 15 cooperative producers in Tlaxiaco and San Cristóbal Amoltepec.
- [ ] Setup and verification of Drips stream split for the student engineering guild.

### 📍 Milestone 3: Real Settlement & Physical Cryptographic Tags *(SCF Build Phase Target)*
- [ ] Automated generation of printable QR and tamper-proof NFC tags for sacks and bottles with embedded royalty provenance.
- [ ] Non-custodial Stellar wallet onboarding for cooperative treasurers and automated royalty off-ramping.
- [ ] Audio prompt localization in indigenous Tu'un Savi (Mixteco language) recorded by native speakers.
- [ ] Anchor on/off-ramp testing (USDC to MXN via Banco del Bienestar / Finabien).

### 📍 Milestone 4: Regional Cooperative Scale *(Scaling Phase)*
- [ ] Onboarding of 5 agricultural & artisan cooperatives across Oaxaca and Puebla.
- [ ] Formal community Appellation of Origin (*Denominación de Origen*) on Stellar.

---

## 💻 Installation & Local Development

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- Google Gemini API Key (`GEMINI_API_KEY`) from [Google AI Studio](https://aistudio.google.com/)

### Step-by-Step Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Open-Hub-Tec/raiz.git
   cd raiz
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key in `.env`:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```

4. **Run the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

---

## 👥 Team & Governance

This project is an open-source social technology initiative spearheaded by **undergraduate engineering students and faculty researchers at the Instituto Tecnológico de Tlaxiaco (TecNM Campus Tlaxiaco)** in the state of Oaxaca, Mexico:

- **Student Developer Guild:** The core development team is formed by indigenous undergraduate students who grew up in the rural and farming towns of the Mixteca Alta. As native speakers and children/grandchildren of local farmers and artisans, they bridge cutting-edge blockchain/AI engineering directly with indigenous community values (*Tequio* - collective voluntary community work).
- **Academic Institution:** Instituto Tecnológico de Tlaxiaco (TecNM), Oaxaca, Mexico.
- **Research & Innovation Focus:** Decentralized Networks (Stellar/Soroban), Applied Agricultural AI (Gemini Multimodal Vision), Indigenous Digital Sovereignty & Financial Inclusion.
- **Official Contact:** `tecnologicotlaxiaco@gmail.com`
- **Participating Indigenous Municipalities & Communities:** Heroica Ciudad de Tlaxiaco, San Cristóbal Amoltepec, Santa María Cuquila, San Juan Mixtepec, San Esteban Atatlahuca, and Santo Tomás Ocotepec.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details. Open distribution, academic replication, and fair-trade commercial usage are encouraged.

<div align="center">
  <sub>Proudly developed in the Heroica Ciudad de Tlaxiaco, Oaxaca, Mexico 🇲🇽</sub>
</div>
