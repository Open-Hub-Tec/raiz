import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import {
  getOfflineLotMetadata,
  getPendingOfflineLots,
  openRaizDB,
  RETRY_DELAYS_MS,
  saveOfflineLot,
  updateOfflineLotStatus,
} from './offlineStorage';
import type { PendingOfflineLot } from '../types';

Object.assign(globalThis, { window: globalThis });

const lot = (tempId: string): PendingOfflineLot => ({
  tempId,
  producerName: 'Test producer',
  community: 'Test community',
  cropType: 'cafe',
  variety: 'Typica',
  weightKgOrUnits: 10,
  priceExpectedMxn: 120,
  photoDataUrl: '',
  recordedAt: Date.now(),
  syncStatus: 'pending',
});

describe('offline outbox', () => {
  it('stores metadata in the outbox and keeps binary media in its own store', async () => {
    await saveOfflineLot(lot('lot-1'));
    const pending = await getPendingOfflineLots();
    expect(pending).toHaveLength(1);
    expect(pending[0].tempId).toBe('lot-1');
    expect(pending[0].syncStatus).toBe('pending');

    const db = await openRaizDB();
    expect(Array.from(db.objectStoreNames)).toEqual(expect.arrayContaining(['outbox_lots', 'media_blobs']));
    db.close();
  });

  it('persists failure state and schedules exponential retry', async () => {
    await saveOfflineLot(lot('lot-2'));
    await updateOfflineLotStatus('lot-2', 'FAILED', 'network unavailable');
    const state = await getOfflineLotMetadata('lot-2');
    expect(state?.status).toBe('FAILED');
    expect(state?.retryCount).toBe(1);
    expect(state?.nextAttemptAt).toBeGreaterThan(Date.now());
    expect(RETRY_DELAYS_MS[0]).toBe(1000);
  });
});
