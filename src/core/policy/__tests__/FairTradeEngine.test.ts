import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FairTradeEngine,
  REGIONAL_COST_MATRICES,
  PriceCheckParams,
  SplitDistribution
} from '../FairTradeEngine';

describe('FairTradeEngine Policy & Anti-Coyote Guardrails', () => {
  describe('Regional Baseline Cost Matrices', () => {
    it('models high-altitude Washed Arabica coffee (>1,200m) with $90 MXN/kg floor', () => {
      const policy = FairTradeEngine.resolvePolicy('cafe', 1350);
      assert.equal(policy.minimumPricePerUnitMxn, 90);
      assert.equal(policy.unit, 'kg pergamino');
      assert.equal(policy.antiCoyoteAlertThreshold, 70);
    });

    it('models standard Arabica coffee when altitude is below 1,200m', () => {
      const policy = FairTradeEngine.resolvePolicy('cafe', 900);
      assert.equal(policy.minimumPricePerUnitMxn, 90);
      assert.equal(policy.unit, 'kg pergamino');
      assert.equal(policy.antiCoyoteAlertThreshold, 65);
    });

    it('models Wild Acahual honey with $120 MXN/liter floor', () => {
      const policy = FairTradeEngine.resolvePolicy('miel-acahual');
      assert.equal(policy.minimumPricePerUnitMxn, 120);
      assert.equal(policy.unit, 'litro');
      assert.equal(policy.antiCoyoteAlertThreshold, 85);
    });

    it('models backstrap loom textiles with $250 MXN/piece floor', () => {
      const policy = FairTradeEngine.resolvePolicy('telar-cintura');
      assert.equal(policy.minimumPricePerUnitMxn, 250);
      assert.equal(policy.unit, 'pieza base');
      assert.equal(policy.antiCoyoteAlertThreshold, 180);
    });

    it('provides safe community fallback for unlisted crops', () => {
      const policy = FairTradeEngine.resolvePolicy('pitaya-silvestre');
      assert.equal(policy.minimumPricePerUnitMxn, 90);
      assert.equal(policy.antiCoyoteAlertThreshold, 65);
      assert.ok(policy.cropName.includes('pitaya-silvestre'));
    });
  });

  describe('validateLotPricing()', () => {
    it('approves lot pricing meeting or exceeding fair trade minimums', () => {
      const result = FairTradeEngine.validateLotPricing({
        cropType: 'cafe',
        unitPriceMxn: 95,
        altitudeMeters: 1400
      });
      assert.equal(result.isFair, true);
      assert.equal(result.isAntiCoyoteWarning, false);
      assert.equal(result.deficitPerUnitMxn, 0);
      assert.ok(result.message.includes('✅'));
    });

    it('flags sub-minimum offer without triggering coyote alarm if above threshold', () => {
      const result = FairTradeEngine.validateLotPricing({
        cropType: 'miel-acahual',
        unitPriceMxn: 100 // below $120 min, but above $85 threshold
      });
      assert.equal(result.isFair, false);
      assert.equal(result.isAntiCoyoteWarning, false);
      assert.equal(result.deficitPerUnitMxn, 20);
      assert.ok(result.message.includes('no cubre el costo mínimo'));
    });

    it('triggers immediate Anti-Coyote Alert when predatory pricing drops below threshold', () => {
      const result = FairTradeEngine.validateLotPricing({
        cropType: 'telar-cintura',
        unitPriceMxn: 150 // severely below $180 coyote threshold
      });
      assert.equal(result.isFair, false);
      assert.equal(result.isAntiCoyoteWarning, true);
      assert.equal(result.deficitPerUnitMxn, 100);
      assert.ok(result.message.includes('⚠️ Alerta de Coyotaje'));
    });

    it('handles zero price as predatory coyote offer', () => {
      const result = FairTradeEngine.validateLotPricing({
        cropType: 'cafe',
        unitPriceMxn: 0
      });
      assert.equal(result.isFair, false);
      assert.equal(result.isAntiCoyoteWarning, true);
      assert.equal(result.unitPriceMxn, 0);
    });

    it('safely clamps negative and NaN pricing inputs to zero', () => {
      const negativeResult = FairTradeEngine.validateLotPricing({
        cropType: 'cafe',
        unitPriceMxn: -45
      });
      assert.equal(negativeResult.unitPriceMxn, 0);
      assert.equal(negativeResult.isAntiCoyoteWarning, true);

      const nanResult = FairTradeEngine.validateLotPricing({
        cropType: 'cafe',
        unitPriceMxn: NaN
      });
      assert.equal(nanResult.unitPriceMxn, 0);
      assert.equal(nanResult.isAntiCoyoteWarning, true);
    });

    it('handles extreme high pricing without overflow', () => {
      const result = FairTradeEngine.validateLotPricing({
        cropType: 'telar-cintura',
        unitPriceMxn: 1_000_000
      });
      assert.equal(result.isFair, true);
      assert.equal(result.deficitPerUnitMxn, 0);
    });
  });

  describe('calculateSplitDistributions() Integer Math & Royalties', () => {
    it('accurately calculates standard 8% artisan and 2% tequio split in cents', () => {
      const totalMxn = 1000;
      const split = FairTradeEngine.calculateSplitDistributions(totalMxn);

      assert.equal(split.totalAmountSubunits, 100000); // 100,000 cents
      assert.equal(split.artisanAmountSubunits, 8000);   // 8% = $80 MXN
      assert.equal(split.tequioAmountSubunits, 2000);    // 2% = $20 MXN
      assert.equal(split.sellerNetAmountSubunits, 90000); // 90% = $900 MXN

      // Invariant: sum of parts must equal total subunits exactly
      assert.equal(
        split.artisanAmountSubunits +
        split.tequioAmountSubunits +
        split.sellerNetAmountSubunits +
        split.roundingRemainderSubunits,
        split.totalAmountSubunits
      );

      assert.equal(split.artisanMxn, 80);
      assert.equal(split.tequioMxn, 20);
      assert.equal(split.sellerNetMxn, 900);
    });

    it('guarantees zero floating point errors with odd amounts and fractional cents', () => {
      const oddAmount = 333.33;
      const split = FairTradeEngine.calculateSplitDistributions(oddAmount);

      assert.equal(split.totalAmountSubunits, 33333); // 33,333 cents
      assert.equal(
        split.artisanAmountSubunits +
        split.tequioAmountSubunits +
        split.sellerNetAmountSubunits,
        split.totalAmountSubunits
      );

      assert.equal(split.roundingRemainderSubunits, 0);
    });

    it('supports Stellar stroops precision (10,000,000 per XLM)', () => {
      const xlmAmount = 50.5;
      const split = FairTradeEngine.calculateSplitDistributions(xlmAmount, {
        unitFormat: 'stroops'
      });

      assert.equal(split.totalAmountSubunits, 505_000_000);
      assert.equal(split.artisanAmountSubunits, 40_400_000);  // 8%
      assert.equal(split.tequioAmountSubunits, 10_100_000);   // 2%
      assert.equal(split.sellerNetAmountSubunits, 454_500_000); // 90%
      assert.equal(
        split.artisanAmountSubunits +
        split.tequioAmountSubunits +
        split.sellerNetAmountSubunits,
        split.totalAmountSubunits
      );
    });

    it('supports custom split percentages', () => {
      const split = FairTradeEngine.calculateSplitDistributions(500, {
        artisanPercentage: 10,
        tequioPercentage: 5
      });
      assert.equal(split.artisanMxn, 50);
      assert.equal(split.tequioMxn, 25);
      assert.equal(split.sellerNetMxn, 425);
    });

    it('handles boundary condition of zero total amount', () => {
      const split = FairTradeEngine.calculateSplitDistributions(0);
      assert.equal(split.totalAmountSubunits, 0);
      assert.equal(split.artisanMxn, 0);
      assert.equal(split.tequioMxn, 0);
      assert.equal(split.sellerNetMxn, 0);
    });

    it('sanitizes negative or non-finite inputs to zero', () => {
      const splitNeg = FairTradeEngine.calculateSplitDistributions(-100);
      assert.equal(splitNeg.totalAmountSubunits, 0);
      assert.equal(splitNeg.sellerNetMxn, 0);

      const splitNaN = FairTradeEngine.calculateSplitDistributions(NaN);
      assert.equal(splitNaN.totalAmountSubunits, 0);
    });
  });

  describe('Legacy API Compatibility', () => {
    it('legacy evaluatePrice() delegates cleanly to validateLotPricing()', () => {
      const res = FairTradeEngine.evaluatePrice('cafe', 100);
      assert.equal(res.isFair, true);
      assert.equal(res.isAntiCoyoteWarning, false);
      assert.ok(res.message);
    });

    it('legacy calculateSecondaryRoyalty() returns expected object structure', () => {
      const res = FairTradeEngine.calculateSecondaryRoyalty(1000, 8);
      assert.equal(res.artisanRoyaltyMxn, 80);
      assert.equal(res.cooperativeFundMxn, 20);
      assert.equal(res.sellerNetMxn, 900);
    });
  });
});
