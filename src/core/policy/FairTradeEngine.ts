/**
 * Raíz Core - Motor de Políticas de Comercio Justo y Protección Comunitaria
 * 
 * Programmatically enforces regional cost floors, flags predatory coyote offers,
 * and calculates automated perpetual secondary royalties (8% to farming families,
 * 2% to community tequio infrastructure) with zero floating-point rounding errors.
 */

export interface FairTradePolicy {
  cropName: string;
  unit: string;
  minimumPricePerUnitMxn: number;
  recommendedPricePerUnitMxn: number;
  antiCoyoteAlertThreshold: number; // Below this threshold, exploitation alert triggers
  description?: string;
}

/**
 * Regional baseline cost matrices for indigenous micro-lots
 */
export const REGIONAL_COST_MATRICES: Record<string, FairTradePolicy> = {
  // High-altitude Washed Arabica coffee (>1,200m)
  "cafe-alta-montana": {
    cropName: "Café Arábica Lavado de Alta Montaña (>1,200m)",
    unit: "kg pergamino",
    minimumPricePerUnitMxn: 90,
    recommendedPricePerUnitMxn: 145,
    antiCoyoteAlertThreshold: 70,
    description: "Cultivado en sombra sobre 1,200 msnm con proceso de fermentación húmeda artesanal."
  },
  // Standard altitude coffee fallback
  "cafe": {
    cropName: "Café Arábica Regional",
    unit: "kg pergamino",
    minimumPricePerUnitMxn: 90,
    recommendedPricePerUnitMxn: 135,
    antiCoyoteAlertThreshold: 65,
    description: "Cosecha regional estándar de café arábica."
  },
  // Wild Acahual honey
  "miel-acahual": {
    cropName: "Miel Silvestre de Acahual",
    unit: "litro",
    minimumPricePerUnitMxn: 120,
    recommendedPricePerUnitMxn: 180,
    antiCoyoteAlertThreshold: 85,
    description: "Miel monofloral silvestre recolectada en floraciones otoñales de la Mixteca."
  },
  "miel": {
    cropName: "Miel Silvestre Regional",
    unit: "litro",
    minimumPricePerUnitMxn: 120,
    recommendedPricePerUnitMxn: 180,
    antiCoyoteAlertThreshold: 80,
    description: "Miel pura de abeja de cooperativa local."
  },
  // Backstrap loom textiles
  "telar-cintura": {
    cropName: "Textil en Telar de Cintura",
    unit: "pieza base",
    minimumPricePerUnitMxn: 250,
    recommendedPricePerUnitMxn: 450,
    antiCoyoteAlertThreshold: 180,
    description: "Tejido artesanal en telar de cintura con hilo de algodón hilado a mano y tintes naturales."
  },
  "artesania": {
    cropName: "Artesanía Tradicional",
    unit: "pieza base",
    minimumPricePerUnitMxn: 250,
    recommendedPricePerUnitMxn: 450,
    antiCoyoteAlertThreshold: 180,
    description: "Artesanías y textiles tradicionales de la comunidad."
  },
  "pulque": {
    cropName: "Pulque Tradicional de Maguey",
    unit: "litro",
    minimumPricePerUnitMxn: 35,
    recommendedPricePerUnitMxn: 55,
    antiCoyoteAlertThreshold: 25,
    description: "Bebida fermentada tradicional de maguey pulquero."
  }
};

// Backwards-compatible alias for existing imports
export const CROP_POLICIES = REGIONAL_COST_MATRICES;

export interface PriceCheckParams {
  cropType: string;
  unitPriceMxn: number;
  quantity?: number;
  altitudeMeters?: number;
  region?: string;
}

export interface EvaluationResult {
  isFair: boolean;
  isAntiCoyoteWarning: boolean;
  cropType: string;
  resolvedPolicy: FairTradePolicy;
  unitPriceMxn: number;
  regionalMinimumMxn: number;
  recommendedPriceMxn: number;
  warningThresholdMxn: number;
  unit: string;
  deficitPerUnitMxn: number;
  message: string;
}

export interface SplitOptions {
  artisanPercentage?: number;  // Default: 8% to farming families / artisans
  tequioPercentage?: number;   // Default: 2% to community infrastructure (tequio)
  unitFormat?: "cents" | "stroops"; // "cents" (100 per MXN) or "stroops" (10,000,000 per XLM)
}

export interface SplitDistribution {
  totalAmountSubunits: number;       // Total amount in integer subunits (cents or stroops)
  artisanAmountSubunits: number;     // 8% allocation in integer subunits
  tequioAmountSubunits: number;      // 2% allocation in integer subunits
  sellerNetAmountSubunits: number;   // Remainder allocation in integer subunits
  roundingRemainderSubunits: number; // Exact rounding residual (if any)
  totalMxn: number;                  // Original total MXN
  artisanMxn: number;                // Calculated MXN equivalent
  tequioMxn: number;                 // Calculated MXN equivalent
  sellerNetMxn: number;              // Calculated MXN equivalent
  unitFormat: "cents" | "stroops";
  percentages: {
    artisan: number;
    tequio: number;
    sellerNet: number;
  };
}

export class FairTradeEngine {
  /**
   * Resolves the appropriate FairTradePolicy based on crop type and environmental qualifiers (e.g. altitude).
   */
  public static resolvePolicy(cropType: string, altitudeMeters?: number): FairTradePolicy {
    const normalizedKey = (cropType || "").toLowerCase().trim();

    // Altitude-based qualification for Arabica coffee
    if (normalizedKey.includes("cafe") || normalizedKey.includes("coffee")) {
      if (altitudeMeters !== undefined && altitudeMeters >= 1200) {
        return REGIONAL_COST_MATRICES["cafe-alta-montana"];
      }
      return REGIONAL_COST_MATRICES["cafe"];
    }

    // Honey matching
    if (normalizedKey.includes("miel") || normalizedKey.includes("honey") || normalizedKey.includes("acahual")) {
      return REGIONAL_COST_MATRICES["miel-acahual"];
    }

    // Backstrap loom textiles
    if (normalizedKey.includes("telar") || normalizedKey.includes("textil") || normalizedKey.includes("cintura")) {
      return REGIONAL_COST_MATRICES["telar-cintura"];
    }

    // Direct key lookup
    if (REGIONAL_COST_MATRICES[normalizedKey]) {
      return REGIONAL_COST_MATRICES[normalizedKey];
    }

    // Default safe baseline fallback
    return {
      cropName: `Lote Agrícola Comunitario (${cropType})`,
      unit: "unidad",
      minimumPricePerUnitMxn: 90,
      recommendedPricePerUnitMxn: 135,
      antiCoyoteAlertThreshold: 65,
      description: "Lote agrícola o artesanal sin política específica; usando salvaguarda regional general."
    };
  }

  /**
   * Validates a lot's proposed pricing against regional baseline cost matrices
   * and anti-coyote exploitation guardrails. Pure deterministic function.
   */
  public static validateLotPricing(params: PriceCheckParams): EvaluationResult {
    const { cropType, unitPriceMxn, altitudeMeters } = params;
    const policy = this.resolvePolicy(cropType, altitudeMeters);

    // Negative or NaN pricing protection
    const safePrice = Number.isFinite(unitPriceMxn) ? Math.max(0, unitPriceMxn) : 0;

    const isAntiCoyoteWarning = safePrice < policy.antiCoyoteAlertThreshold;
    const isFair = safePrice >= policy.minimumPricePerUnitMxn;
    const deficitPerUnitMxn = isFair ? 0 : policy.minimumPricePerUnitMxn - safePrice;

    let message: string;
    if (isAntiCoyoteWarning) {
      message = `⚠️ Alerta de Coyotaje: El precio propuesto ($${safePrice.toFixed(2)} MXN/${policy.unit}) está severamente por debajo del umbral de subsistencia comunitaria ($${policy.antiCoyoteAlertThreshold} MXN/${policy.unit}) para ${policy.cropName}. Deficit crítico: -$${deficitPerUnitMxn.toFixed(2)} MXN.`;
    } else if (!isFair) {
      message = `El precio propuesto ($${safePrice.toFixed(2)} MXN/${policy.unit}) no cubre el costo mínimo regional ($${policy.minimumPricePerUnitMxn} MXN/${policy.unit}) para ${policy.cropName}. Déficit: -$${deficitPerUnitMxn.toFixed(2)} MXN.`;
    } else {
      message = `✅ Precio de comercio justo verificado ($${safePrice.toFixed(2)} MXN/${policy.unit}) para ${policy.cropName}. Cumple los estándares comunitarios.`;
    }

    return {
      isFair,
      isAntiCoyoteWarning,
      cropType,
      resolvedPolicy: policy,
      unitPriceMxn: safePrice,
      regionalMinimumMxn: policy.minimumPricePerUnitMxn,
      recommendedPriceMxn: policy.recommendedPricePerUnitMxn,
      warningThresholdMxn: policy.antiCoyoteAlertThreshold,
      unit: policy.unit,
      deficitPerUnitMxn,
      message
    };
  }

  /**
   * Calculates exact integer split distributions for secondary royalties:
   * 8% to farming families / artisans, 2% to community tequio infrastructure,
   * with the remainder going to the seller net.
   * 
   * Uses exact integer arithmetic (cents or stroops) to completely eliminate
   * floating-point rounding errors. Pure deterministic function.
   */
  public static calculateSplitDistributions(
    totalSaleAmountMxn: number,
    options?: SplitOptions
  ): SplitDistribution {
    const artisanRate = options?.artisanPercentage ?? 8;
    const tequioRate = options?.tequioPercentage ?? 2;
    const unitFormat = options?.unitFormat ?? "cents";

    // Subunit multiplier: 100 for cents, 10,000,000 for Stellar stroops
    const multiplier = unitFormat === "stroops" ? 10_000_000 : 100;

    // Sanitize non-finite or negative total
    const safeTotal = Number.isFinite(totalSaleAmountMxn) ? Math.max(0, totalSaleAmountMxn) : 0;

    // Convert total to integer subunits
    const totalAmountSubunits = Math.round(safeTotal * multiplier);

    // Exact integer allocations via floor division
    const artisanAmountSubunits = Math.floor((totalAmountSubunits * artisanRate) / 100);
    const tequioAmountSubunits = Math.floor((totalAmountSubunits * tequioRate) / 100);
    const sellerNetAmountSubunits = totalAmountSubunits - artisanAmountSubunits - tequioAmountSubunits;

    // Rounding remainder verification
    const remainderSubunits = totalAmountSubunits - (artisanAmountSubunits + tequioAmountSubunits + sellerNetAmountSubunits);

    return {
      totalAmountSubunits,
      artisanAmountSubunits,
      tequioAmountSubunits,
      sellerNetAmountSubunits,
      roundingRemainderSubunits: remainderSubunits,
      totalMxn: safeTotal,
      artisanMxn: artisanAmountSubunits / multiplier,
      tequioMxn: tequioAmountSubunits / multiplier,
      sellerNetMxn: sellerNetAmountSubunits / multiplier,
      unitFormat,
      percentages: {
        artisan: artisanRate,
        tequio: tequioRate,
        sellerNet: Math.max(0, 100 - artisanRate - tequioRate)
      }
    };
  }

  /**
   * Legacy method for backwards compatibility with existing frontend calls.
   */
  public static evaluatePrice(cropType: string, price: number): {
    isFair: boolean;
    isAntiCoyoteWarning: boolean;
    message: string;
  } {
    const result = this.validateLotPricing({ cropType, unitPriceMxn: price });
    return {
      isFair: result.isFair,
      isAntiCoyoteWarning: result.isAntiCoyoteWarning,
      message: result.message
    };
  }

  /**
   * Legacy method for backwards compatibility with existing frontend calls.
   */
  public static calculateSecondaryRoyalty(salePriceMxn: number, royaltyPercentage = 8): {
    artisanRoyaltyMxn: number;
    cooperativeFundMxn: number;
    sellerNetMxn: number;
  } {
    const split = this.calculateSplitDistributions(salePriceMxn, {
      artisanPercentage: royaltyPercentage,
      tequioPercentage: 2,
      unitFormat: "cents"
    });

    return {
      artisanRoyaltyMxn: split.artisanMxn,
      cooperativeFundMxn: split.tequioMxn,
      sellerNetMxn: split.sellerNetMxn
    };
  }
}
