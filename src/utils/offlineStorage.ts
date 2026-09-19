import { PendingOfflineLot } from '../types';

const DB_NAME = 'RaizMixtecaDB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_harvest_lots';

export async function openRaizDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB no está soportado en este entorno'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'tempId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 1. Guardar lote de cosecha localmente en la memoria del teléfono
export async function saveOfflineLot(lot: PendingOfflineLot): Promise<void> {
  try {
    const db = await openRaizDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(lot);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Fallback: guardando lote en localStorage por restricción de iframe:', err);
    try {
      const existing = JSON.parse(localStorage.getItem(STORE_NAME) || '[]');
      const filtered = existing.filter((item: PendingOfflineLot) => item.tempId !== lot.tempId);
      localStorage.setItem(STORE_NAME, JSON.stringify([...filtered, lot]));
    } catch (e) {
      console.error('Error guardando en almacenamiento local:', e);
    }
  }
}

// 2. Obtener todos los lotes pendientes de subir
export async function getPendingOfflineLots(): Promise<PendingOfflineLot[]> {
  try {
    const db = await openRaizDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    try {
      return JSON.parse(localStorage.getItem(STORE_NAME) || '[]');
    } catch {
      return [];
    }
  }
}

// 3. Eliminar lote una vez certificado y subido a la red
export async function deleteOfflineLot(tempId: string): Promise<void> {
  try {
    const db = await openRaizDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(tempId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    try {
      const existing = JSON.parse(localStorage.getItem(STORE_NAME) || '[]');
      localStorage.setItem(
        STORE_NAME,
        JSON.stringify(existing.filter((item: PendingOfflineLot) => item.tempId !== tempId))
      );
    } catch (e) {
      console.error('Error borrando de localStorage:', e);
    }
  }
}

export const removeOfflineLot = deleteOfflineLot;
