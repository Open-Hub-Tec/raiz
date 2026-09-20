/**
 * Raíz Core - Motor Criptográfico de Integridad.
 *
 * The digest format deliberately uses canonical JSON.  JSON.stringify's
 * insertion-order behavior is not a portable wire format: two callers can
 * provide the same object with different key order and produce different
 * hashes.  Sorting keys here makes the digest reproducible across browsers,
 * Node, and CI.
 */

export type BinaryInput = string | Uint8Array | ArrayBuffer;

export interface LotDigestInput {
  producerName: string;
  community?: string;
  parcelLocation?: string;
  audio?: BinaryInput;
  photo?: BinaryInput;
  /** Legacy aliases retained for callers already using the public API. */
  audioBase64?: string;
  photoBase64?: string;
  timestamp: number;
  latitude?: number;
  longitude?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }

  // Node fallback; this branch is never evaluated by browser builds.
  return Buffer.from(bytes).toString('base64');
}

function canonicalValue(value: unknown): unknown {
  if (value instanceof Uint8Array) {
    return { __binary: bytesToBase64(value) };
  }
  if (value instanceof ArrayBuffer) {
    return { __binary: bytesToBase64(new Uint8Array(value)) };
  }
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, child]) => child !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalValue(child)]),
    );
  }
  return value;
}

export function canonicalizeLotPayload(input: LotDigestInput): string {
  return JSON.stringify(canonicalValue(input));
}

function toBytes(data: BinaryInput): Uint8Array {
  if (typeof data === 'string') return new TextEncoder().encode(data);
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export class CryptoEngine {
  /** Compute a real SHA-256 digest, never a non-cryptographic placeholder. */
  public static async computeSha256(data: BinaryInput): Promise<string> {
    const bytes = toBytes(data);
    const subtle = globalThis.crypto?.subtle;

    if (subtle) {
      const hash = await subtle.digest('SHA-256', bytes);
      return toHex(new Uint8Array(hash));
    }

    // Node environments without globalThis.crypto (older Node or restricted
    // test runners) use the platform implementation instead of a weak hash.
    const { createHash } = await import('node:crypto');
    return createHash('sha256').update(bytes).digest('hex');
  }

  /** Generate a deterministic digest for a complete lot provenance payload. */
  public static async generateCommunityDigest(input: LotDigestInput): Promise<string> {
    const { audioBase64, photoBase64, ...rest } = input;
    const normalized: LotDigestInput = {
      ...rest,
      audio: input.audio ?? audioBase64,
      photo: input.photo ?? photoBase64,
    };
    return this.computeSha256(canonicalizeLotPayload(normalized));
  }
}
