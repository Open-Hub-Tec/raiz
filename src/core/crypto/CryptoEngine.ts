/**
 * Raíz Core - Motor Criptográfico de Integridad
 * 
 * Computes deterministic, immutable SHA-256 digests combining:
 * 1. Producer identification and parcel coordinates (5-decimal precision).
 * 2. Authentic oral audio testimonial in indigenous variant (Tu'un Savi, Zapotec, Spanish).
 * 3. Batch photography or textile sample.
 * 4. Unix timestamp and lot metadata.
 * 
 * Guarantees cross-platform determinism (Browser WebCrypto API + Node.js node:crypto).
 */

export interface ParcelLocation {
  latitude: number;
  longitude: number;
  elevationMeters?: number;
  municipality?: string;
  state?: string;
}

export interface LotDigestInput {
  producerId: string;
  producerName: string;
  community: string;
  parcelLocation: ParcelLocation;
  cropType: string;
  harvestTimestamp: number;
  audioTestimonialSha256?: string;
  photoSampleSha256?: string;
  lotWeightKg?: number;
  notes?: string;
  [key: string]: any;
}

export class CryptoEngine {
  /**
   * Computes deterministic SHA-256 hash supporting string, Uint8Array, ArrayBuffer, and ArrayBufferViews.
   * Hybrid execution: Native window.crypto.subtle in browsers with automatic fallback
   * to globalThis.crypto / node:crypto in Node.js server-side and CI unit test environments.
   */
  public static async computeSha256(
    data: string | Uint8Array | ArrayBuffer | ArrayBufferLike | ArrayBufferView
  ): Promise<string> {
    let uint8Data: Uint8Array;

    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      uint8Data = encoder.encode(data);
    } else if (data instanceof Uint8Array) {
      uint8Data = data;
    } else if (ArrayBuffer.isView(data)) {
      uint8Data = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    } else if (data instanceof ArrayBuffer || (typeof SharedArrayBuffer !== 'undefined' && data instanceof SharedArrayBuffer)) {
      uint8Data = new Uint8Array(data as ArrayBuffer);
    } else {
      throw new TypeError("CryptoEngine.computeSha256 requires string, Uint8Array, or ArrayBuffer.");
    }

    // 1. Check for standard Web Crypto API (Browser & Node.js 19+)
    const cryptoSubtle = 
      (typeof window !== 'undefined' && window.crypto?.subtle) ||
      (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle);

    if (cryptoSubtle) {
      try {
        const hashBuffer = await cryptoSubtle.digest('SHA-256', uint8Data as unknown as ArrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        // Fallback to node:crypto if subtle digest fails
      }
    }

    // 2. Node.js node:crypto fallback for server-side / CI execution
    try {
      // Dynamic import to avoid bundling errors in browser packagers
      const nodeCrypto = await import('node:crypto');
      const hash = nodeCrypto.createHash('sha256');
      hash.update(uint8Data);
      return hash.digest('hex');
    } catch (e) {
      throw new Error(`Failed to compute SHA-256: No cryptographic implementation available. ${e}`);
    }
  }

  /**
   * Canonicalizes a lot payload ensuring dictionary keys are sorted alphabetically
   * and floating-point coordinates are formatted to exact 5-decimal precision.
   * Eliminates cross-platform, cross-runtime serialization discrepancies.
   */
  public static canonicalizeLotPayload(input: Record<string, any>): string {
    const normalizeValue = (val: any, keyName?: string): any => {
      if (val === null || val === undefined) {
        return null;
      }

      // Coordinate precision normalization (5-decimal precision: ~1.1 meters accuracy)
      if (typeof val === 'number') {
        if (keyName === 'latitude' || keyName === 'longitude') {
          return Number(val.toFixed(5));
        }
        return val;
      }

      if (Array.isArray(val)) {
        return val.map(item => normalizeValue(item));
      }

      if (typeof val === 'object' && !(val instanceof Uint8Array) && !(val instanceof Date)) {
        const sortedKeys = Object.keys(val).sort();
        const sortedObj: Record<string, any> = {};
        for (const k of sortedKeys) {
          if (val[k] !== undefined) {
            sortedObj[k] = normalizeValue(val[k], k);
          }
        }
        return sortedObj;
      }

      return val;
    };

    const canonicalObj = normalizeValue(input);
    return JSON.stringify(canonicalObj);
  }

  /**
   * Generates the immutable Community Authenticity Digest combining:
   * 1. Producer identification and parcel coordinates.
   * 2. Oral audio testimonial hash (Tu'un Savi, Zapotec, Spanish).
   * 3. Sample batch photograph hash.
   * 4. Timestamp and harvest details.
   */
  public static async generateCommunityDigest(params: LotDigestInput | {
    producerName: string;
    community: string;
    timestamp: number;
    audioBase64?: string;
    photoBase64?: string;
  }): Promise<string> {
    // Support legacy parameter structure for backwards compatibility
    if ('timestamp' in params && !('harvestTimestamp' in params)) {
      const legacyParams = params as any;
      const audioHash = legacyParams.audioBase64 
        ? await this.computeSha256(legacyParams.audioBase64.slice(0, 500)) 
        : 'no_audio';
      const photoHash = legacyParams.photoBase64 
        ? await this.computeSha256(legacyParams.photoBase64.slice(0, 500)) 
        : 'no_photo';

      const legacyStructured: LotDigestInput = {
        producerId: legacyParams.producerName.toLowerCase().replace(/\s+/g, '_'),
        producerName: legacyParams.producerName,
        community: legacyParams.community,
        parcelLocation: { latitude: 17.50000, longitude: -97.50000 },
        cropType: 'general',
        harvestTimestamp: legacyParams.timestamp,
        audioTestimonialSha256: audioHash,
        photoSampleSha256: photoHash
      };

      const canonicalJson = this.canonicalizeLotPayload(legacyStructured);
      return this.computeSha256(canonicalJson);
    }

    const canonicalJson = this.canonicalizeLotPayload(params as LotDigestInput);
    return this.computeSha256(canonicalJson);
  }
}
