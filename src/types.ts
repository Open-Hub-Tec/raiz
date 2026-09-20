export type NavigationTab = 'chat' | 'menu' | 'productos';

export type AppLanguage = 'es' | 'mix';

export type ScreenView =
  | 'menu_principal'
  | 'registro_productor'
  | 'catalogo_producto'
  | 'registrar_lote_cafe'
  | 'pasaporte_digital'
  | 'vitrina_productos';

export interface ProductItem {
  id: string;
  title: string;
  category: string;
  badge?: string;
  craftType: string;
  description: string;
  price: number;
  artisanName: string;
  artisanInitials: string;
  location: string;
  stock: string;
  imageUrl: string;
  imageAlt: string;
  isCustomOrder?: boolean;
}

export interface LotTimelineEvent {
  title: string;
  dateAndLocation: string;
  color: string;
}

export interface DigitalPassportLot {
  id: string;
  code: string;
  title: string;
  productType: string;
  imageUrl: string;
  imageAlt: string;
  producerName: string;
  producerInitials: string;
  location: string;
  volumeKg: number;
  verifiedStatus: string;
  evaluatorOrg: string;
  tags: string[];
  timeline: LotTimelineEvent[];
  pricePerKg: number;
  hash: string;
  variety?: string;
  altitude?: string;
  process?: string;
  notes?: string;
  // Normative Compliance Evidence (NMX-F-083 / NOM-255-SCFI)
  nomCompliance?: {
    standard: string;
    humidity: string;
    humidityCompliant: boolean;
    defectPercentage: number;
    defectClassification: string;
    altitudeMeters: number;
    strictAltitude: boolean;
    botanicalPurity: string;
    agroecologicalFreePesticides: boolean;
    evidencePhotos?: {
      grainGridSampleUrl?: string;
      humidityGaugeUrl?: string;
      foliarHealthUrl?: string;
    };
    stellarTxLedger?: number;
    stellarTxHash?: string;
    stellarTimestamp?: string;
    immutableSealStatus?: 'Sellado Inmutable' | 'Pendiente';
  };
  royaltyClause?: {
    percentage: number;
    beneficiary: string;
    smartContractPolicy: string;
    accumulatedRoyaltiesMxn?: number;
    secondarySalesCount?: number;
  };
}

export interface PaymentRecord {
  id: string;
  date: string;
  concept: string;
  lotCode: string;
  amount: number;
  status: 'Completado' | 'En proceso' | 'Disponible';
  buyer: string;
  paymentType?: 'Venta Directa' | 'Regalía Perpetua' | 'Anticipo';
  royaltyRate?: string;
  resaleOrigin?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  audioDuration?: string;
  badge?: string;
  options?: { id: number | string; label: string; sublabel?: string }[];
  isRead?: boolean;
  card?: BotCardData;
}

export type BotCardType =
  | 'lote_registro'
  | 'dictamen_stellar'
  | 'billetera_pago'
  | 'producto_vitrina'
  | 'trazabilidad_pasaporte'
  | 'agente_multiagente'
  | 'logistica_coyote'
  | 'regalias_mercado'
  | 'recibo_ticket';

export interface BotCardData {
  type: BotCardType;
  title?: string;
  subtitle?: string;
  agentName?: string;
  badge?: string;
  data?: Record<string, any>;
}

/**
 * Interface for Issue #1.1: Modo Parcela Offline
 * Used by students to persist harvest data locally in IndexedDB before syncing to Stellar
 */
export interface PendingOfflineLot {
  tempId: string;
  producerName: string;
  community: string;
  cropType: 'cafe' | 'miel' | 'pulque' | 'artesania';
  variety: string;
  weightKgOrUnits: number;
  priceExpectedMxn: number;
  photoDataUrl: string;
  voiceAudioBlob?: Blob;
  recordedAt: number;
  syncStatus: 'pending' | 'syncing' | 'synced';
}

/** Durable state kept by the offline outbox. Binary media is stored separately. */
export type OfflineLotStatus = 'PENDING' | 'UPLOADING' | 'SEALED' | 'FAILED';

export interface OfflineLotMetadata {
  tempId: string;
  producerName: string;
  community: string;
  cropType: PendingOfflineLot['cropType'];
  variety: string;
  weightKgOrUnits: number;
  priceExpectedMxn: number;
  recordedAt: number;
  status: OfflineLotStatus;
  retryCount: number;
  nextAttemptAt: number | null;
  lastError?: string;
  photoMediaId?: string;
  audioMediaId?: string;
}

export interface OfflineMediaBlob {
  id: string;
  lotId: string;
  kind: 'photo' | 'audio';
  blob: Blob;
  mimeType: string;
}
