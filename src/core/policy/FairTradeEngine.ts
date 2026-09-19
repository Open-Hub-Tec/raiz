/**
 * Raíz Core - Motor de Políticas de Comercio Justo y Protección Comunitaria
 * Valida que los precios no estén por debajo de costos rurales y
 * calcula automáticamente las regalías secundarias para las artesanas y cafeticultores.
 */

export interface FairTradePolicy {
  minimumPricePerKgMxn: number;
  recommendedPricePerKgMxn: number;
  antiCoyoteAlertThreshold: number; // Por debajo de este precio se alerta posible despojo
}

export const CROP_POLICIES: Record<string, FairTradePolicy> = {
  cafe: {
    minimumPricePerKgMxn: 90,
    recommendedPricePerKgMxn: 135,
    antiCoyoteAlertThreshold: 65,
  },
  miel: {
    minimumPricePerKgMxn: 120,
    recommendedPricePerKgMxn: 180,
    antiCoyoteAlertThreshold: 80,
  },
  pulque: {
    minimumPricePerKgMxn: 35,
    recommendedPricePerKgMxn: 55,
    antiCoyoteAlertThreshold: 25,
  },
  artesania: {
    minimumPricePerKgMxn: 250,
    recommendedPricePerKgMxn: 450,
    antiCoyoteAlertThreshold: 180,
  },
};

export class FairTradeEngine {
  /**
   * Evalúa si un precio propuesto es justo según la política comunitaria
   */
  public static evaluatePrice(cropType: string, price: number): {
    isFair: boolean;
    isAntiCoyoteWarning: boolean;
    message: string;
  } {
    const policy = CROP_POLICIES[cropType] || CROP_POLICIES.cafe;

    if (price < policy.antiCoyoteAlertThreshold) {
      return {
        isFair: false,
        isAntiCoyoteWarning: true,
        message: `⚠️ Alerta de Coyotaje: El precio ($${price} MXN) está muy por debajo del costo de producción regional ($${policy.minimumPricePerKgMxn} MXN).`,
      };
    }

    if (price < policy.minimumPricePerKgMxn) {
      return {
        isFair: false,
        isAntiCoyoteWarning: false,
        message: `El precio está por debajo del mínimo sugerido de la cooperativa ($${policy.minimumPricePerKgMxn} MXN).`,
      };
    }

    return {
      isFair: true,
      isAntiCoyoteWarning: false,
      message: `✅ Precio de comercio justo verificado ($${price} MXN).`,
    };
  }

  /**
   * Calcula la regalía secundaria perpetua para el artesano o productor (5% - 10%)
   */
  public static calculateSecondaryRoyalty(salePriceMxn: number, royaltyPercentage = 8): {
    artisanRoyaltyMxn: number;
    cooperativeFundMxn: number;
    sellerNetMxn: number;
  } {
    const artisanRoyaltyMxn = Math.round((salePriceMxn * royaltyPercentage) / 100);
    const cooperativeFundMxn = Math.round((salePriceMxn * 2) / 100); // 2% fondo comunitario
    const sellerNetMxn = salePriceMxn - artisanRoyaltyMxn - cooperativeFundMxn;

    return {
      artisanRoyaltyMxn,
      cooperativeFundMxn,
      sellerNetMxn,
    };
  }
}
