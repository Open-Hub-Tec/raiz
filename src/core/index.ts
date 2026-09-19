/**
 * Raíz Core - Índice Público del Núcleo de Dominio
 * Punto de entrada único para React, PWA, Apps Android o Servicios Externos.
 */

export * from './crypto/CryptoEngine';
export * from './sync/SyncEngine';
export * from './policy/FairTradeEngine';
export * from './blockchain/SorobanAdapter';

import { CryptoEngine } from './crypto/CryptoEngine';
import { SyncEngine } from './sync/SyncEngine';
import { FairTradeEngine } from './policy/FairTradeEngine';
import { SorobanAdapter, DEFAULT_STELLAR_CONFIG } from './blockchain/SorobanAdapter';

export const RaizCore = {
  crypto: CryptoEngine,
  sync: SyncEngine,
  fairTrade: FairTradeEngine,
  soroban: new SorobanAdapter(DEFAULT_STELLAR_CONFIG),
  
  /**
   * Inicializa los servicios del Core en el ciclo de vida de la app
   */
  init: () => {
    SyncEngine.initAutoSync();
    console.log('🌱 Raíz Core inicializado: Sincronización offline y Criptografía comunitaria listos.');
  },
};

export default RaizCore;
