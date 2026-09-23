# 💧 Raíz Mixteca: Modular Drips & Stellar Grant Issues Roadmap

This document outlines the decoupled, modular engineering tasks for developers, open-source contributors, and TecNM engineering students funded through the **Stellar Community Fund & Drips Network**.

Each issue is self-contained with well-defined inputs, test-driven acceptance criteria (DoD), and isolated module boundaries to enable concurrent development without blocking other contributors.

---

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MODULE ISSUE DEPENDENCY GRAPH                   │
├─────────────────────────┬──────────────────────────┬───────────────────┤
│ PHASE 1: DOMAIN CORE    │ PHASE 2: FIELD RESILIENCE│ PHASE 3: WEB3     │
│ (Platform-Agnostic)     │ (Hardware / Rural UX)    │ (Stellar/Soroban) │
├─────────────────────────┼──────────────────────────┼───────────────────┤
│ [ISSUE #101]            │ [ISSUE #201]             │ [ISSUE #301]      │
│ Community Digest SHA-256│ IndexedDB Outbox Queue   │ Soroban RPC & XDR │
│                         │                          │ Lot Binding       │
│ [ISSUE #102]            │ [ISSUE #202]             │ [ISSUE #302]      │
│ FairTrade Policy Engine │ Opus 24kbps Audio        │ Fee-Bump Gasless  │
│ & Anti-Coyote Guardrails│ Compression for Voices   │ Sponsorship Relay │
└─────────────────────────┴──────────────────────────┴───────────────────┘
```

---

## 🟢 PHASE 1: DECOUPLED DOMAIN CORE (`src/core/`)

### 📌 ISSUE #101: `[Core/Crypto]` Canonical Community Digest SHA-256 Hashing Engine
* **Target File:** `src/core/crypto/CryptoEngine.ts`
* **Labels:** `drips-eligible`, `good-first-issue`, `crypto`, `unit-tests`, `phase-1`
* **Estimated Effort:** 150 USDC / Drips Tier 1 (1–2 days)
* **Difficulty:** Beginner - Intermediate

#### Problem Statement:
To create an immutable provenance passport for an indigenous micro-lot (coffee, honey, or loom textiles), we must compute a deterministic cryptographic digest combining:
1. Producer identification and parcel location.
2. The authentic oral audio testimonial in an indigenous variant (Tu'un Savi, Zapotec, or Spanish).
3. The photograph of the harvested batch or textile sample.
4. Unix timestamp and geographical coordinates (5-decimal precision).

#### Technical Specifications:
1. Refactor `CryptoEngine.computeSha256()` to accept `string`, `Uint8Array`, and `ArrayBuffer`.
2. Implement `canonicalizeLotPayload(input: LotDigestInput): string` ensuring dictionary keys are sorted alphabetically before serialization to prevent cross-platform hash discrepancies.
3. Support hybrid execution: Native `window.crypto.subtle` in browsers with automatic fallback to Node's `node:crypto` when run server-side or in CI unit tests.
4. Write test suite in `src/core/crypto/__tests__/CryptoEngine.test.ts` with at least 6 deterministic test vectors.

#### Definition of Done (Acceptance Criteria):
- [ ] `npm run test` passes 100% without UI or React dependencies.
- [ ] Calling the digest with identical values in differing key order yields the exact same SHA-256 hash.
- [ ] Zero heavy external dependencies (leverages native Web Crypto API).

---

### 📌 ISSUE #102: `[Core/Policy]` FairTrade Rule Engine & Anti-Coyote Price Guardrails
* **Target File:** `src/core/policy/FairTradeEngine.ts`
* **Labels:** `drips-eligible`, `core-logic`, `math`, `governance`, `phase-1`
* **Estimated Effort:** 200 USDC / Drips Tier 1 (2–3 days)
* **Difficulty:** Intermediate

#### Problem Statement:
Predatory intermediaries ("coyotes") exploit remote communities by purchasing harvest below rural maintenance costs. The platform must programmatically enforce regional cost floors, flag predatory offers, and calculate automated perpetual secondary royalties (8% to farming families, 2% to community tequio infrastructure).

#### Technical Specifications:
1. Implement `FairTradeEngine.validateLotPricing(params: PriceCheckParams): EvaluationResult`.
2. Model regional baseline cost matrices:
   - High-altitude Washed Arabica coffee (>1,200m): Minimum $90 MXN/kg parchment.
   - Wild Acahual honey: Minimum $120 MXN/liter.
   - Backstrap loom textiles: Minimum $250 MXN per base piece.
3. Implement `calculateSplitDistributions(totalSaleAmountMxn: number, options: SplitOptions)` returning exact integer stroops/cents to eliminate floating-point rounding errors.
4. Add comprehensive test coverage in `src/core/policy/__tests__/FairTradeEngine.test.ts`.

#### Definition of Done (Acceptance Criteria):
- [ ] Pure deterministic functions with no side-effects.
- [ ] Test coverage ≥ 95% covering edge cases (zero values, extreme bounds, unlisted crops).

---

## 🟡 PHASE 2: FIELD RESILIENCE & RURAL HARDWARE

### 📌 ISSUE #201: `[Offline/Sync]` ACID Outbox Transactional Queue in IndexedDB
* **Target Files:** `src/core/sync/SyncEngine.ts` & `src/utils/offlineStorage.ts`
* **Labels:** `drips-eligible`, `offline-first`, `indexeddb`, `pwa`, `phase-2`
* **Estimated Effort:** 350 USDC / Drips Tier 2 (3–5 days)
* **Difficulty:** Intermediate - Advanced

#### Problem Statement:
Indigenous producers operate in mountain micro-climates completely disconnected from 3G/4G cellular reception. The application must store multi-batch harvests locally without memory exhaustion and auto-sync immediately upon detecting connectivity in town.

#### Technical Specifications:
1. Upgrade `offlineStorage.ts` to a typed IndexedDB schema with transaction stores:
   - `outbox_lots`: Pending metadata and status (`PENDING`, `UPLOADING`, `SEALED`, `FAILED`).
   - `media_blobs`: Separate store for binary image and audio blobs (avoiding raw base64 memory leaks).
2. Implement exponential backoff retry policy (1s, 2s, 4s, 8s...) with auto-recovery on `window.addEventListener('online')`.
3. Provide reactive status subscriptions (`SyncEngine.subscribe()`) updating UI badges with count of queued offline harvests.

#### Definition of Done (Acceptance Criteria):
- [ ] Offline batch save completes in < 200ms on mobile storage.
- [ ] Browser refresh / offline reload (`F5`) retains 100% of un-synced data.
- [ ] Graceful fallback and user alerts on `QuotaExceededError`.

---

### 📌 ISSUE #202: `[Voice/Audio]` 24kbps Opus Audio Recording & Compression for Indigenous Variants
* **Target Files:** `src/utils/audioRecorder.ts` & `src/components/RegisterCoffeeLotScreen.tsx`
* **Labels:** `drips-eligible`, `voice-first`, `multimedia`, `accessibility`, `phase-2`
* **Estimated Effort:** 250 USDC / Drips Tier 2 (2–4 days)
* **Difficulty:** Intermediate

#### Problem Statement:
Uncompressed WAV files generate 5 MB to 10 MB per minute, making sync impossible over 2G/EDGE networks in rural municipalities. Audio testimonials must be compressed while preserving voice authenticity and phoneme nuances across indigenous variants.

#### Technical Specifications:
1. Configure `MediaRecorder` in `audioRecorder.ts` to prioritize `audio/webm;codecs=opus` or `audio/ogg;codecs=opus` targeted at 24 kbps.
2. Enforce 90-second hardware auto-stop timer with auditory/visual cues.
3. Extract real-time voice decibel meter to a reusable React hook `useAudioLevelMeter(stream)`.

#### Definition of Done (Acceptance Criteria):
- [ ] 30-second audio recording file size is strictly ≤ 150 KB with clear vocal comprehension.
- [ ] Dual-engine compatibility verified for Android Chrome and iOS Safari.

---

## 🔵 PHASE 3: STELLAR WEB3 & SOROBAN INTEGRATION

### 📌 ISSUE #301: `[Web3/Soroban]` Native XDR Serialization & RPC Binding for `LotPassport` Contract
* **Target File:** `src/core/blockchain/SorobanAdapter.ts`
* **Labels:** `drips-eligible`, `soroban`, `stellar`, `smart-contracts`, `phase-3`
* **Estimated Effort:** 400 USDC / Drips Tier 3 (4–6 days)
* **Difficulty:** Advanced

#### Problem Statement:
`SorobanAdapter` currently generates simulated ledger hashes. It must integrate the official `@stellar/stellar-sdk` to execute real contract invocations against Soroban Testnet and Futurenet.

#### Technical Specifications:
1. Configure `@stellar/stellar-sdk` isolated inside `src/core/blockchain/`.
2. Implement `buildRegisterLotTransaction()` mapping domain parameters to contract types:
   - `lot_code`: `Symbol`
   - `digest`: `BytesN<32>`
   - `producer_id`: `Address`
   - `altitude`: `u32`
3. Execute pre-flight simulation (`server.simulateTransaction`) to estimate CPU instructions and ledger read/write footprints.
4. Parse Soroban result envelopes to return validated ledger sequence, txHash, and explorer URLs (Stellar Expert).

#### Definition of Done (Acceptance Criteria):
- [ ] Standalone test runner script (`scripts/test-soroban-register.ts`) successfully submits a live transaction to Soroban Testnet.
- [ ] UI remains fully responsive even when Stellar RPC endpoints experience latency.

---

### 📌 ISSUE #302: `[Web3/Gasless]` Fee-Bump Transaction Sponsorship Relay
* **Target File:** `src/core/blockchain/FeeSponsorRelay.ts`
* **Labels:** `drips-eligible`, `stellar-tx`, `security`, `gasless`, `phase-3`
* **Estimated Effort:** 350 USDC / Drips Tier 3 (3–5 days)
* **Difficulty:** Advanced

#### Problem Statement:
Indigenous elders and rural farmers do not hold native XLM balances to pay network gas fees. The cooperative node or TecNM institutional gateway must sponsor all transaction fees transparently using native Stellar Fee-Bump mechanics (SEP-0015).

#### Technical Specifications:
1. Implement `FeeSponsorRelay.sponsorTransaction(innerTx: Transaction): Promise<FeeBumpTransaction>`.
2. Configure secure institutional sponsorship keys (`SPONSOR_SOURCE_KEY`).
3. Implement `maxFee` protection ceilings to prevent gas-drain attacks.

#### Definition of Done (Acceptance Criteria):
- [ ] End-user keys sign the payload with 0.0000000 XLM balance.
- [ ] Final transaction broadcasts successfully on Testnet, debited from the designated institutional sponsor account.
