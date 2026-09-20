# 💧 Raíz Mixteca: Modular Drips & Stellar Grant Issues Backlog
**Repository:** Open-Hub-Tec/raiz  
**Grant Program:** Stellar Community Fund / Drips Network  

---

## 📌 ISSUE #101: [Core/Crypto]: Canonical Community Digest SHA-256 Hashing Engine
- **GitHub Issue Tracker:** [#3](https://github.com/Open-Hub-Tec/raiz/issues/3)
- **Target Module:** `src/core/crypto/CryptoEngine.ts`
- **Labels:** `drips-eligible`, `good-first-issue`, `crypto`, `unit-tests`, `phase-1`
- **Estimated Bounty:** 150 USDC / Drips Tier 1 (1–2 days)

### 🎯 Problem Statement
To create an immutable provenance passport for an indigenous micro-lot (coffee, honey, or backstrap loom textiles), we must compute a deterministic cryptographic digest combining:
1. Producer identification and parcel location.
2. The authentic oral audio testimonial in an indigenous variant (Tu'un Savi, Zapotec, or Spanish).
3. The photograph of the harvested batch or textile sample.
4. Unix timestamp and geographical coordinates (5-decimal precision).

### 🛠️ Technical Tasks
- [ ] Refactor `CryptoEngine.computeSha256()` to accept `string`, `Uint8Array`, and `ArrayBuffer`.
- [ ] Implement `canonicalizeLotPayload(input: LotDigestInput): string` ensuring dictionary keys are sorted alphabetically before serialization to prevent cross-platform hash discrepancies.
- [ ] Support hybrid execution: Native `window.crypto.subtle` in browsers with automatic fallback to Node's `node:crypto` when run server-side or in CI unit tests.
- [ ] Write test suite in `src/core/crypto/__tests__/CryptoEngine.test.ts` with at least 6 deterministic test vectors.

### ✅ Definition of Done (Acceptance Criteria)
- [ ] `npm run test` passes 100% without UI or React dependencies.
- [ ] Calling the digest with identical values in differing key order yields the exact same SHA-256 hash.
- [ ] Zero heavy external dependencies (leverages native Web Crypto API).

---
---

## 📌 ISSUE #102: [Core/Policy]: FairTrade Rule Engine & Anti-Coyote Price Guardrails
- **GitHub Issue Tracker:** [#4](https://github.com/Open-Hub-Tec/raiz/issues/4)
- **Target Module:** `src/core/policy/FairTradeEngine.ts`
- **Labels:** `drips-eligible`, `core-logic`, `math`, `governance`, `phase-1`
- **Estimated Bounty:** 200 USDC / Drips Tier 1 (2–3 days)

### 🎯 Problem Statement
Predatory intermediaries ("coyotes") exploit remote communities by purchasing harvest below rural maintenance costs. The platform must programmatically enforce regional cost floors, flag predatory offers, and calculate automated perpetual secondary royalties (8% to farming families, 2% to community tequio infrastructure).

### 🛠️ Technical Tasks
- [ ] Implement `FairTradeEngine.validateLotPricing(params: PriceCheckParams): EvaluationResult`.
- [ ] Model regional baseline cost matrices:
  - High-altitude Washed Arabica coffee (>1,200m): Minimum $90 MXN/kg parchment.
  - Wild Acahual honey: Minimum $120 MXN/liter.
  - Backstrap loom textiles: Minimum $250 MXN per base piece.
- [ ] Implement `calculateSplitDistributions(totalSaleAmountMxn: number, options: SplitOptions)` returning exact integer stroops/cents to eliminate floating-point rounding errors.
- [ ] Add comprehensive test coverage in `src/core/policy/__tests__/FairTradeEngine.test.ts`.

### ✅ Definition of Done (Acceptance Criteria)
- [ ] Pure deterministic functions with no side-effects.
- [ ] Test coverage ≥ 95% covering edge cases (zero values, extreme bounds, unlisted crops).

---
---

## 📌 ISSUE #201: [Offline/Sync]: ACID Outbox Transactional Queue in IndexedDB
- **GitHub Issue Tracker:** [#5](https://github.com/Open-Hub-Tec/raiz/issues/5)
- **Target Modules:** `src/core/sync/SyncEngine.ts` & `src/utils/offlineStorage.ts`
- **Labels:** `drips-eligible`, `offline-first`, `indexeddb`, `pwa`, `phase-2`
- **Estimated Bounty:** 350 USDC / Drips Tier 2 (3–5 days)

### 🎯 Problem Statement
Indigenous producers operate in mountain micro-climates completely disconnected from 3G/4G cellular reception. The application must store multi-batch harvests locally without memory exhaustion and auto-sync immediately upon detecting connectivity in town.

### 🛠️ Technical Tasks
- [ ] Upgrade `offlineStorage.ts` to a typed IndexedDB schema with transaction stores:
  - `outbox_lots`: Pending metadata and status (`PENDING`, `UPLOADING`, `SEALED`, `FAILED`).
  - `media_blobs`: Separate store for binary image and audio blobs (avoiding raw base64 memory leaks).
- [ ] Implement exponential backoff retry policy (1s, 2s, 4s, 8s...) with auto-recovery on `window.addEventListener('online')`.
- [ ] Provide reactive status subscriptions (`SyncEngine.subscribe()`) updating UI badges with count of queued offline harvests.

### ✅ Definition of Done (Acceptance Criteria)
- [ ] Offline batch save completes in < 200ms on mobile storage.
- [ ] Browser refresh / offline reload (`F5`) retains 100% of un-synced data.
- [ ] Graceful fallback and user alerts on `QuotaExceededError`.

---
---

## 📌 ISSUE #202: [Voice/Audio]: 24kbps Opus Audio Recording & Compression for Indigenous Variants
- **GitHub Issue Tracker:** [#6](https://github.com/Open-Hub-Tec/raiz/issues/6)
- **Target Modules:** `src/utils/audioRecorder.ts` & `src/components/RegisterCoffeeLotScreen.tsx`
- **Labels:** `drips-eligible`, `voice-first`, `multimedia`, `accessibility`, `phase-2`
- **Estimated Bounty:** 250 USDC / Drips Tier 2 (2–4 days)

### 🎯 Problem Statement
Uncompressed WAV files generate 5 MB to 10 MB per minute, making sync impossible over 2G/EDGE networks in rural municipalities. Audio testimonials must be compressed while preserving voice authenticity and phoneme nuances across indigenous variants.

### 🛠️ Technical Tasks
- [ ] Configure `MediaRecorder` in `audioRecorder.ts` to prioritize `audio/webm;codecs=opus` or `audio/ogg;codecs=opus` targeted at 24 kbps.
- [ ] Enforce 90-second hardware auto-stop timer with auditory/visual cues.
- [ ] Extract real-time voice decibel meter to a reusable React hook `useAudioLevelMeter(stream)`.

### ✅ Definition of Done (Acceptance Criteria)
- [ ] 30-second audio recording file size is strictly ≤ 150 KB with clear vocal comprehension.
- [ ] Dual-engine compatibility verified for Android Chrome and iOS Safari.

---
---

## 📌 ISSUE #301: [Web3/Soroban]: Native XDR Serialization & RPC Binding for LotPassport Contract
- **GitHub Issue Tracker:** [#7](https://github.com/Open-Hub-Tec/raiz/issues/7)
- **Target Module:** `src/core/blockchain/SorobanAdapter.ts`
- **Labels:** `drips-eligible`, `soroban`, `stellar`, `smart-contracts`, `phase-3`
- **Estimated Bounty:** 400 USDC / Drips Tier 3 (4–6 days)

### 🎯 Problem Statement
`SorobanAdapter` currently generates simulated ledger hashes. It must integrate the official `@stellar/stellar-sdk` to execute real contract invocations against Soroban Testnet and Futurenet.

### 🛠️ Technical Tasks
- [ ] Configure `@stellar/stellar-sdk` isolated inside `src/core/blockchain/`.
- [ ] Implement `buildRegisterLotTransaction()` mapping domain parameters to contract types:
  - `lot_code`: `Symbol`
  - `digest`: `BytesN<32>`
  - `producer_id`: `Address`
  - `altitude`: `u32`
- [ ] Execute pre-flight simulation (`server.simulateTransaction`) to estimate CPU instructions and ledger read/write footprints.
- [ ] Parse Soroban result envelopes to return validated ledger sequence, txHash, and explorer URLs (Stellar Expert).

### ✅ Definition of Done (Acceptance Criteria)
- [ ] Standalone test runner script (`scripts/test-soroban-register.ts`) successfully submits a live transaction to Soroban Testnet.
- [ ] UI remains fully responsive even when Stellar RPC endpoints experience latency.

---
---

## 📌 ISSUE #302: [Web3/Gasless]: Fee-Bump Transaction Sponsorship Relay for Rural Producers
- **GitHub Issue Tracker:** [#8](https://github.com/Open-Hub-Tec/raiz/issues/8)
- **Target Module:** `src/core/blockchain/FeeSponsorRelay.ts`
- **Labels:** `drips-eligible`, `stellar-tx`, `security`, `gasless`, `phase-3`
- **Estimated Bounty:** 350 USDC / Drips Tier 3 (3–5 days)

### 🎯 Problem Statement
Indigenous elders and rural farmers do not hold native XLM balances to pay network gas fees. The cooperative node or TecNM institutional gateway must sponsor all transaction fees transparently using native Stellar Fee-Bump mechanics (SEP-0015).

### 🛠️ Technical Tasks
- [ ] Implement `FeeSponsorRelay.sponsorTransaction(innerTx: Transaction): Promise<FeeBumpTransaction>`.
- [ ] Configure secure institutional sponsorship keys (`SPONSOR_SOURCE_KEY`).
- [ ] Implement `maxFee` protection ceilings to prevent gas-drain attacks.

### ✅ Definition of Done (Acceptance Criteria)
- [ ] End-user keys sign the payload with 0.0000000 XLM balance.
- [ ] Final transaction broadcasts successfully on Testnet, debited from the designated institutional sponsor account.
