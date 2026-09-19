# ⚖️ Market Dynamics & Incentives: Producer Direct Sales vs. Downstream Resellers

A foundational question in fair-trade marketplace economics is:
> *If an indigenous producer sells a micro-lot of coffee or artisanal textiles to a specialty buyer/reseller, and later lists additional inventory directly in the cooperative showcase, how does the reseller compete without being undercut?*

This document outlines the **economic alignment, value-add transformation, and game-theoretic incentives** engineered into the **Raíz Protocol** on Stellar and Soroban.

---

## 1. The Asymmetry of Product State: Raw Commodity vs. Transformed Experience

The producer and the specialty commercializer operate at completely different links of the value chain:

```
+--------------------------+       Direct Wholesale       +------------------------------------+
|  Indigenous Producer     | ---------------------------> | Specialty Roaster / Boutique Brand |
|  - Raw Pergamino Coffee  |                              | - Specialty Roast Profile (SCA 85+) |
|  - Bulk Hand-spun Silk   |                              | - Hermetic Degassing Packaging     |
|  - Artisanal Telar Piece |                              | - Urban Retail & Specialty Brewing |
+--------------------------+                              +------------------------------------+
            |                                                               |
    Direct Showcase                                                 Urban / Global Showcase
 (Ex-Works / Farm Gate)                                         (In-Store / Same-Day Delivery)
            v                                                               v
   Local Buyer / Roaster                                           End Specialty Consumer
    ($140 - $180 MXN/kg)                                           ($350 - $550 MXN/kg)
```

1. **The Producer Sells Raw/Pergamino Matter:** 
   The smallholder typically produces green coffee or dried pergamino requiring hulling (*trillado*), optical sorting, profile roasting, and degassing packaging. An urban end-consumer cannot drink unroasted green coffee.
2. **The Reseller Sells Curated Transformation:**
   The specialty roastery or boutique adds value through precision roasting (e.g., light-medium roast highlighting notes of citrus and piloncillo), custom grind sizing, packaging design, and barista service.
3. **Complementary Rather Than Substitutive:** 
   The end-consumer in Mexico City, Monterrey, New York, or Berlin pays $350–$550 MXN not for raw seeds, but for the transformed, roasted, ready-to-brew experience.

---

## 2. Geography, Logistics, and Availability (The Cost of Immediacy)

* **Producer's Direct Listing:** Located in rural mountain communities (e.g., Yucuhiti, Santa Cruz Itundujia, or San Cristóbal Amoltepec, Oaxaca). Purchasing 1 or 2 kg directly involves regional ground shipping, 4 to 7 business days delivery time, and freight fees that exceed the unit value for small purchases.
* **Reseller's Urban Placement:** Situated in specialty retail bars, regional hubs, or urban distribution centers:
  - Immediate availability (takeaway cup or same-day local delivery).
  - Frictionless consumer touchpoint.
  - Consumers willingly pay a premium for physical presence and instant gratification.

---

## 3. The Digital Passport as a Selling Asset, Not a Threat

In predatory supply chains, intermediaries hide the producer's identity out of fear that buyers will bypass them. 

In specialty fair trade (Third Wave Coffee and curated ethnographic craft), **radical provenance is the highest-margin selling proposition**:
* Top roasteries prominently showcase the producer's name, community elevation, and bean variety on every bag (*"Produced by Don Efraín Bautista, 1,750 MASL, Typica"*).
* The **Raíz Digital Passport QR** cryptographically validates authenticity, preventing fraudulent commercial dilution and providing independent laboratory cupping grades (SCA score).
* The reseller uses the Raíz provenance passport to justify charging premium prices ($25 to $35 USD/bag) to conscious global consumers.

---

## 4. Wholesale Volume vs. Retail Capacity Constraints

Producers have finite annual yields (e.g., 15 to 40 quintales per harvest):
* An artisanal farmer cannot manage 5,000 individual e-commerce shipments, retail customer service inquiries, or merchant dispute chargebacks.
* The showcase allows producers to set distinct **tier pricing**:
  - **Retail Tier (Menudeo):** Small quantities sold directly at retail prices.
  - **Commercial Wholesale Tier (Mayoreo):** Substantial volume discounts for certified fair-trade partners who absorb inventory risk and provide upfront working capital (*anticipos de cosecha*).
* The reseller acts as the indispensable regional liquidity engine.

---

## 5. The Soroban Perpetual Royalty: Positive-Sum Game Theory

Under traditional systems, the relationship between reseller and producer is zero-sum: every peso the reseller makes after purchase is completely disconnected from the producer.

Raíz transforms this into a **positive-sum ecosystem via RaizCore Policy Engine (`src/core/policy/FairTradeEngine.ts`) and Soroban Smart Contracts**:
* **8% Perpetual Royalty to Producer:** Every time the reseller packages, resells, or auctions a certified micro-lot, **8% of the secondary resale volume** is calculated by `FairTradeEngine` and streamed back to the producer's Stellar wallet.
* **2% Community Tequio Pool:** Feeds collective agricultural infrastructure and elder mutual funds.
* **Anti-Coyote Guardrails:** The engine programmatically triggers warnings whenever incoming trade offers fall below fair regional cost thresholds ($90 MXN/kg for coffee, $250 MXN for loom textiles).
* **Incentive Alignment:** The producer **actively wants the reseller to succeed and sell at the highest possible price**, because higher downstream margins generate continuous passive revenue without requiring additional labor or logistical overhead from the farming family.

---

## Summary Matrix

| Dimension | Producer Direct Showcase | Downstream Specialty Reseller |
| :--- | :--- | :--- |
| **Product Stage** | Green / Pergamino / Raw Artisan Base | Specialty Roasted / Ground / Curated Boutique |
| **Primary Customer** | Roasters, Cooperatives, Local Enthusiasts | Urban End-Consumers, Cafes, Global Retail |
| **Fulfillment** | Rural dispatch (4–7 business days) | Instant in-store or same-day local delivery |
| **Batch Size** | Micro-lots, full sacks (69 kg), bulk cuts | 250g / 500g retail bags, individual garments |
| **Economic Dynamic** | Base farmgate margin + 8% perpetual royalty | Value-add transformation margin + provenance cachet |
