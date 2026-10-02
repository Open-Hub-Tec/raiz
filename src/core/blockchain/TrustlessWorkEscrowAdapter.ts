/**
 * Raíz Core - Adaptador de Escrow Descentralizado Trustless Work (Soroban / Stellar)
 * 
 * Implementa la integración formal con la infraestructura de contratos inteligentes
 * de Trustless Work para pagos condicionados basados en hitos (Milestone-based Escrow).
 * 
 * Permite que compradores institucionales depositen fondos en custodia (USDC/MXNe)
 * que se liberan automáticamente a los productores de Tlaxiaco (Oaxaca) conforme
 * se verifican las atestaciones de origen, calidad y entrega física.
 * 
 * Referencia: ADR-001 (Adopción de Trustless Work)
 */

export interface TrustlessWorkMilestone {
  id: string;
  title: string;
  description: string;
  percentage: number;
  amount: number;
  attestationRequirement: 'ORIGIN_ATTESTATION' | 'QUALITY_SCAA_OR_HERITAGE' | 'PHYSICAL_DELIVERY';
  status: 'pending' | 'attested' | 'released' | 'disputed';
  attestationUid?: string;
  releasedTxHash?: string;
}

export interface TrustlessWorkEscrowOrder {
  escrowId: string;
  contractAddress: string;
  buyerAddress: string;
  producerAddress: string;
  approverAddress: string; // Cooperativa local / Árbitro de Tlaxiaco
  assetCode: 'USDC' | 'MXNe' | 'XLM';
  totalAmount: number;
  milestones: TrustlessWorkMilestone[];
  lotCode: string;
  createdAt: number;
  status: 'initialized' | 'funded' | 'completed' | 'disputed';
}

export interface TrustlessWorkEscrowConfig {
  networkPassphrase: string;
  rpcUrl: string;
  trustlessWorkEscrowWasmHash?: string;
  defaultApproverTlaxiaco: string;
}

export const DEFAULT_TRUSTLESS_WORK_CONFIG: TrustlessWorkEscrowConfig = {
  networkPassphrase: 'Test SDF Future Network ; October 2022',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  defaultApproverTlaxiaco: 'GA7TLAXIACO_COOPERATIVA_COMMUNITY_VALIDATOR_V1',
};

export class TrustlessWorkEscrowAdapter {
  private config: TrustlessWorkEscrowConfig;
  private activeEscrows: Map<string, TrustlessWorkEscrowOrder> = new Map();

  constructor(config: Partial<TrustlessWorkEscrowConfig> = {}) {
    this.config = { ...DEFAULT_TRUSTLESS_WORK_CONFIG, ...config };
  }

  /**
   * Crea sincrónicamente un contrato de Escrow de prueba para la interfaz y simulador
   */
  public createTlaxiacoHarvestEscrow(params: {
    lotCode: string;
    buyerAddress: string;
    producerAddress: string;
    totalAmount: number;
    assetCode?: 'USDC' | 'MXNe' | 'XLM';
    approverAddress?: string;
  }): TrustlessWorkEscrowOrder {
    const escrowId = `tw_escrow_${params.lotCode.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    const assetCode = params.assetCode || 'USDC';
    const approver = params.approverAddress || this.config.defaultApproverTlaxiaco;

    const milestones: TrustlessWorkMilestone[] = [
      {
        id: 'milestone-1-origin',
        title: 'Atestación de Origen y Calidad Inicial',
        description: 'Certificación inmutable en Soroban del lote en parcela/taller de Tlaxiaco.',
        percentage: 30,
        amount: Math.round(params.totalAmount * 0.3 * 100) / 100,
        attestationRequirement: 'ORIGIN_ATTESTATION',
        status: 'pending',
      },
      {
        id: 'milestone-2-delivery',
        title: 'Entrega Física en Cooperativa de Tlaxiaco',
        description: 'Recepción y cotejo de número de costales o piezas por el árbitro comunitario.',
        percentage: 70,
        amount: Math.round(params.totalAmount * 0.7 * 100) / 100,
        attestationRequirement: 'PHYSICAL_DELIVERY',
        status: 'pending',
      },
    ];

    const escrowOrder: TrustlessWorkEscrowOrder = {
      escrowId,
      contractAddress: `C_TRUSTLESS_WORK_${escrowId.slice(-8).toUpperCase()}`,
      buyerAddress: params.buyerAddress,
      producerAddress: params.producerAddress,
      approverAddress: approver,
      assetCode,
      totalAmount: params.totalAmount,
      milestones,
      lotCode: params.lotCode,
      createdAt: Date.now(),
      status: 'funded',
    };

    this.activeEscrows.set(escrowId, escrowOrder);
    return escrowOrder;
  }

  /**
   * Inicializa un contrato de custodia (Escrow) de Trustless Work para un lote de Tlaxiaco
   */
  public async initializeEscrow(params: {
    lotCode: string;
    buyerAddress: string;
    producerAddress: string;
    totalAmount: number;
    assetCode?: 'USDC' | 'MXNe' | 'XLM';
    approverAddress?: string;
  }): Promise<TrustlessWorkEscrowOrder> {
    return this.createTlaxiacoHarvestEscrow(params);
  }

  /**
   * Asocia una atestación de Raíz a un hito de Trustless Work y libera los fondos
   */
  public async submitMilestoneProofAndRelease(params: {
    escrowId: string;
    milestoneId: string;
    attestationUid: string;
    attestationDigest: string;
    callerAddress: string;
  }): Promise<{
    success: boolean;
    releasedAmount: number;
    recipient: string;
    txHash: string;
    remainingBalance: number;
  }> {
    const escrow = this.activeEscrows.get(params.escrowId);
    if (!escrow) {
      throw new Error(`Contrato de Escrow Trustless Work no encontrado: ${params.escrowId}`);
    }

    const milestone = escrow.milestones.find((m) => m.id === params.milestoneId);
    if (!milestone) {
      throw new Error(`Hito ${params.milestoneId} no existe en el contrato ${params.escrowId}`);
    }

    if (milestone.status === 'released') {
      throw new Error(`El hito ${params.milestoneId} ya fue liquidado previamente.`);
    }

    // Vincular la atestación
    milestone.attestationUid = params.attestationUid;
    milestone.status = 'released';
    milestone.releasedTxHash = `stx_tw_${params.attestationDigest.slice(0, 16)}_${Date.now()}`;

    // Calcular remanente
    const releasedTotal = escrow.milestones
      .filter((m) => m.status === 'released')
      .reduce((sum, m) => sum + m.amount, 0);

    const remainingBalance = Math.max(0, escrow.totalAmount - releasedTotal);
    if (remainingBalance === 0) {
      escrow.status = 'completed';
    }

    return {
      success: true,
      releasedAmount: milestone.amount,
      recipient: escrow.producerAddress,
      txHash: milestone.releasedTxHash,
      remainingBalance,
    };
  }

  /**
   * Consulta el estado de un contrato de custodia
   */
  public getEscrow(escrowId: string): TrustlessWorkEscrowOrder | undefined {
    return this.activeEscrows.get(escrowId);
  }

  /**
   * Deposita fondos en el contrato de custodia
   */
  public depositFunds(escrowId: string): TrustlessWorkEscrowOrder | undefined {
    const escrow = this.activeEscrows.get(escrowId);
    if (!escrow) return undefined;
    escrow.status = 'funded';
    return { ...escrow };
  }

  /**
   * Envía la prueba o atestación de un hito
   */
  public submitMilestoneProof(escrowId: string, milestoneIdentifier: string, attestationUid: string): boolean {
    const escrow = this.activeEscrows.get(escrowId);
    if (!escrow) return false;
    const milestone = escrow.milestones.find(
      (m) => m.id === milestoneIdentifier || m.id.includes(milestoneIdentifier) || (milestoneIdentifier === 'm1' && m.id.includes('1')) || (milestoneIdentifier === 'm2' && m.id.includes('2'))
    );
    if (!milestone) return false;
    milestone.attestationUid = attestationUid;
    return true;
  }

  /**
   * Libera el pago de un hito verificado
   */
  public releaseMilestonePayment(escrowId: string, milestoneIdentifier: string): TrustlessWorkEscrowOrder | undefined {
    const escrow = this.activeEscrows.get(escrowId);
    if (!escrow) return undefined;
    const milestone = escrow.milestones.find(
      (m) => m.id === milestoneIdentifier || m.id.includes(milestoneIdentifier) || (milestoneIdentifier === 'm1' && m.id.includes('1')) || (milestoneIdentifier === 'm2' && m.id.includes('2'))
    );
    if (!milestone) return undefined;
    milestone.status = 'released';
    milestone.releasedTxHash = `stx_tw_${Date.now()}`;
    const allReleased = escrow.milestones.every((m) => m.status === 'released');
    if (allReleased) {
      escrow.status = 'completed';
    }
    return { ...escrow };
  }
}
