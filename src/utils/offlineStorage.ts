import {
  OfflineLotMetadata,
  OfflineLotStatus,
  OfflineMediaBlob,
  PendingOfflineLot,
} from '../types';

const DB_NAME = 'RaizMixtecaDB';
const DB_VERSION = 2;
const OUTBOX_STORE = 'outbox_lots';
const MEDIA_STORE = 'media_blobs';
const LEGACY_STORE = 'pending_harvest_lots';

export const RETRY_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 16_000];

export class OfflineStorageQuotaError extends Error {
  constructor(message = 'No hay espacio suficiente para guardar el lote sin conexión') {
    super(message);
    this.name = 'OfflineStorageQuotaError';
  }
}

function isQuotaError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'QuotaExceededError';
}

function dataUrlToBlob(dataUrl: string): Blob | undefined {
  const match = dataUrl.match(/^data:([^;,]+)?(?:;base64)?,(.*)$/);
  if (!match) return undefined;
  const mimeType = match[1] || 'application/octet-stream';
  const binary = match[0].includes(';base64')
    ? atob(match[2])
    : decodeURIComponent(match[2]);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function toMetadata(lot: PendingOfflineLot, photoMediaId?: string, audioMediaId?: string): OfflineLotMetadata {
  return {
    tempId: lot.tempId,
    producerName: lot.producerName,
    community: lot.community,
    cropType: lot.cropType,
    variety: lot.variety,
    weightKgOrUnits: lot.weightKgOrUnits,
    priceExpectedMxn: lot.priceExpectedMxn,
    recordedAt: lot.recordedAt,
    status: 'PENDING',
    retryCount: 0,
    nextAttemptAt: null,
    photoMediaId,
    audioMediaId,
  };
}

function fromMetadata(metadata: OfflineLotMetadata, photoDataUrl: string, voiceAudioBlob?: Blob): PendingOfflineLot {
  return {
    tempId: metadata.tempId,
    producerName: metadata.producerName,
    community: metadata.community,
    cropType: metadata.cropType,
    variety: metadata.variety,
    weightKgOrUnits: metadata.weightKgOrUnits,
    priceExpectedMxn: metadata.priceExpectedMxn,
    photoDataUrl,
    voiceAudioBlob,
    recordedAt: metadata.recordedAt,
    syncStatus: metadata.status === 'SEALED' ? 'synced' : metadata.status === 'UPLOADING' ? 'syncing' : 'pending',
  };
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionToPromise(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
  });
}

async function migrateLegacyRecords(db: IDBDatabase): Promise<void> {
  if (!db.objectStoreNames.contains(LEGACY_STORE)) return;
  const readTx = db.transaction(LEGACY_STORE, 'readonly');
  const legacy = await requestToPromise<PendingOfflineLot[]>(readTx.objectStore(LEGACY_STORE).getAll());
  const tx = db.transaction(OUTBOX_STORE, 'readwrite');
  for (const lot of legacy) {
    tx.objectStore(OUTBOX_STORE).put(toMetadata(lot));
  }
  await transactionToPromise(tx);
}

export async function openRaizDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB no está soportado en este entorno'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        const store = db.createObjectStore(OUTBOX_STORE, { keyPath: 'tempId' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('nextAttemptAt', 'nextAttemptAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        const store = db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
        store.createIndex('lotId', 'lotId', { unique: false });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      migrateLegacyRecords(db).then(() => resolve(db), reject);
    };
    request.onerror = () => reject(request.error);
  });
}

// 1. Guardar lote de cosecha localmente en la memoria del teléfono
export async function saveOfflineLot(lot: PendingOfflineLot): Promise<void> {
  try {
    const db = await openRaizDB();
    const photoBlob = dataUrlToBlob(lot.photoDataUrl);
    const photoMediaId = photoBlob ? `${lot.tempId}:photo` : undefined;
    const audioMediaId = lot.voiceAudioBlob ? `${lot.tempId}:audio` : undefined;
    const tx = db.transaction([OUTBOX_STORE, MEDIA_STORE], 'readwrite');
    tx.objectStore(OUTBOX_STORE).put(toMetadata(lot, photoMediaId, audioMediaId));
    if (photoBlob) tx.objectStore(MEDIA_STORE).put({ id: photoMediaId, lotId: lot.tempId, kind: 'photo', blob: photoBlob, mimeType: photoBlob.type });
    if (lot.voiceAudioBlob) tx.objectStore(MEDIA_STORE).put({ id: audioMediaId, lotId: lot.tempId, kind: 'audio', blob: lot.voiceAudioBlob, mimeType: lot.voiceAudioBlob.type });
    await transactionToPromise(tx);
  } catch (err) {
    if (isQuotaError(err)) throw new OfflineStorageQuotaError();
    try {
      const existing = JSON.parse(localStorage.getItem(OUTBOX_STORE) || '[]');
      const filtered = existing.filter((item: PendingOfflineLot) => item.tempId !== lot.tempId);
      localStorage.setItem(OUTBOX_STORE, JSON.stringify([...filtered, { ...lot, voiceAudioBlob: undefined }]));
    } catch (e) {
      if (isQuotaError(e)) throw new OfflineStorageQuotaError();
      throw e;
    }
  }
}

// 2. Obtener todos los lotes pendientes de subir
export async function getPendingOfflineLots(): Promise<PendingOfflineLot[]> {
  try {
    const db = await openRaizDB();
    const metadataTx = db.transaction(OUTBOX_STORE, 'readonly');
    const metadata = await requestToPromise<OfflineLotMetadata[]>(metadataTx.objectStore(OUTBOX_STORE).getAll());
    const mediaTx = db.transaction(MEDIA_STORE, 'readonly');
    const media = await requestToPromise<OfflineMediaBlob[]>(mediaTx.objectStore(MEDIA_STORE).getAll());
    const byId = new Map(media.map((item) => [item.id, item]));
    return Promise.all(metadata.filter((item) => item.status !== 'SEALED').map(async (item) => {
      const photo = item.photoMediaId ? byId.get(item.photoMediaId) : undefined;
      const audio = item.audioMediaId ? byId.get(item.audioMediaId) : undefined;
      return fromMetadata(item, photo ? await blobToDataUrl(photo.blob) : '', audio?.blob);
    }));
  } catch (err) {
    return JSON.parse(localStorage.getItem(OUTBOX_STORE) || '[]');
  }
}

export async function updateOfflineLotStatus(
  tempId: string,
  status: OfflineLotStatus,
  error?: string,
): Promise<void> {
  const db = await openRaizDB();
  const readTx = db.transaction(OUTBOX_STORE, 'readonly');
  const metadata = await requestToPromise<OfflineLotMetadata | undefined>(readTx.objectStore(OUTBOX_STORE).get(tempId));
  if (!metadata) throw new Error(`Lote offline no encontrado: ${tempId}`);
  const retryCount = status === 'FAILED' ? metadata.retryCount + 1 : metadata.retryCount;
  const delay = RETRY_DELAYS_MS[Math.min(retryCount - 1, RETRY_DELAYS_MS.length - 1)] || RETRY_DELAYS_MS.at(-1)!;
  const tx = db.transaction(OUTBOX_STORE, 'readwrite');
  tx.objectStore(OUTBOX_STORE).put({ ...metadata, status, retryCount, nextAttemptAt: status === 'FAILED' ? Date.now() + delay : null, lastError: error });
  await transactionToPromise(tx);
}

export async function getOfflineLotMetadata(tempId: string): Promise<OfflineLotMetadata | undefined> {
  try {
    const db = await openRaizDB();
    const tx = db.transaction(OUTBOX_STORE, 'readonly');
    const metadata = await requestToPromise<OfflineLotMetadata | undefined>(tx.objectStore(OUTBOX_STORE).get(tempId));
    await transactionToPromise(tx);
    return metadata;
  } catch {
    const records = JSON.parse(localStorage.getItem(OUTBOX_STORE) || '[]') as OfflineLotMetadata[];
    return records.find((record) => record.tempId === tempId);
  }
}

// 3. Eliminar lote una vez certificado y subido a la red
export async function deleteOfflineLot(tempId: string): Promise<void> {
  try {
    const db = await openRaizDB();
    const mediaTx = db.transaction(MEDIA_STORE, 'readonly');
    const media = await requestToPromise<OfflineMediaBlob[]>(mediaTx.objectStore(MEDIA_STORE).index('lotId').getAll(tempId));
    const tx = db.transaction([OUTBOX_STORE, MEDIA_STORE], 'readwrite');
    tx.objectStore(OUTBOX_STORE).delete(tempId);
    for (const item of media) tx.objectStore(MEDIA_STORE).delete(item.id);
    await transactionToPromise(tx);
  } catch (err) {
    const existing = JSON.parse(localStorage.getItem(OUTBOX_STORE) || '[]');
    localStorage.setItem(OUTBOX_STORE, JSON.stringify(existing.filter((item: PendingOfflineLot) => item.tempId !== tempId)));
  }
}

export const removeOfflineLot = deleteOfflineLot;
