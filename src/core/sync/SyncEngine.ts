/**
 * Raíz Core - Motor de Sincronización Diferida (Offline Sync Queue)
 * Administra la cola de salida (Outbox) cuando el productor trabaja
 * en la parcela o taller sin señal, y sincroniza automáticamente
 * al recuperar cobertura en la cabecera municipal.
 */

import { PendingOfflineLot } from '../../types';
import {
  getOfflineLotMetadata,
  getPendingOfflineLots,
  openRaizDB,
  removeOfflineLot,
  saveOfflineLot,
  updateOfflineLotStatus,
} from '../../utils/offlineStorage';
import { CryptoEngine } from '../crypto/CryptoEngine';

export interface SyncResult {
  syncedCount: number;
  failedCount: number;
  syncedIds: string[];
}

export type SyncStatusListener = (status: {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTimestamp?: number;
}) => void;

export class SyncEngine {
  private static listeners: Set<SyncStatusListener> = new Set();
  private static isSyncing = false;

  /**
   * Suscribirse a actualizaciones del estado de sincronización
   */
  public static subscribe(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    // Notificar estado actual inmediatamente
    this.notifyStatus();
    return () => this.listeners.delete(listener);
  }

  private static async notifyStatus(lastSyncTimestamp?: number): Promise<void> {
    const pending = await getPendingOfflineLots();
    this.listeners.forEach(listener => {
      listener({
        isSyncing: this.isSyncing,
        pendingCount: pending.length,
        lastSyncTimestamp,
      });
    });
  }

  /**
   * Encola un nuevo lote cosechado en la parcela en almacenamiento local
   */
  public static async enqueueHarvestLot(lot: PendingOfflineLot): Promise<void> {
    await saveOfflineLot(lot);
    await this.notifyStatus();
  }

  /**
   * Procesa la cola de sincronización cuando hay internet
   */
  public static async processQueue(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { syncedCount: 0, failedCount: 0, syncedIds: [] };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('SyncEngine: Sin conexión a internet. La sincronización se pospone.');
      return { syncedCount: 0, failedCount: 0, syncedIds: [] };
    }

    this.isSyncing = true;
    await this.notifyStatus();

    const pending = await getPendingOfflineLots();
    const syncedIds: string[] = [];
    let failedCount = 0;

    for (const lot of pending) {
      const metadata = await getOfflineLotMetadata(lot.tempId);
      if (metadata?.nextAttemptAt && metadata.nextAttemptAt > Date.now()) continue;
      try {
        await updateOfflineLotStatus(lot.tempId, 'UPLOADING');
        // 1. Validar integridad criptográfica del lote
        const digest = await CryptoEngine.generateCommunityDigest({
          producerName: lot.producerName,
          community: lot.community,
          timestamp: lot.recordedAt,
          photoBase64: lot.photoDataUrl,
        });

        // 2. Simular o ejecutar la llamada al contrato Soroban / API de anclaje
        console.log(`SyncEngine: Sellando lote ${lot.tempId} con hash ${digest.slice(0, 16)}...`);
        
        // Simulación de latencia de red segura (300ms)
        await new Promise(r => setTimeout(r, 300));

        // 3. Mark sealed before removing the local outbox record.
        await updateOfflineLotStatus(lot.tempId, 'SEALED');
        await removeOfflineLot(lot.tempId);
        syncedIds.push(lot.tempId);
      } catch (err) {
        console.error(`SyncEngine: Error al sincronizar lote ${lot.tempId}:`, err);
        try {
          await updateOfflineLotStatus(lot.tempId, 'FAILED', err instanceof Error ? err.message : String(err));
        } catch (statusError) {
          console.error(`SyncEngine: No se pudo persistir el reintento de ${lot.tempId}:`, statusError);
        }
        failedCount++;
      }
    }

    this.isSyncing = false;
    const now = Date.now();
    await this.notifyStatus(now);

    return {
      syncedCount: syncedIds.length,
      failedCount,
      syncedIds,
    };
  }

  /**
   * Inicia el vigilante de reconexión automática
   */
  public static initAutoSync(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('SyncEngine: Conexión recuperada. Procesando cola de cosechas pendientes...');
      this.processQueue();
    });
    if (navigator.onLine) void this.processQueue();
  }
}
