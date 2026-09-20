import { describe, expect, it } from 'vitest';
import { canonicalizeLotPayload, CryptoEngine, type LotDigestInput } from '../CryptoEngine';

describe('CryptoEngine', () => {
  it('computes the standard SHA-256 test vector', async () => {
    await expect(CryptoEngine.computeSha256('abc')).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('accepts Uint8Array and ArrayBuffer inputs', async () => {
    const bytes = new TextEncoder().encode('abc');
    const expected = await CryptoEngine.computeSha256('abc');

    await expect(CryptoEngine.computeSha256(bytes)).resolves.toBe(expected);
    await expect(CryptoEngine.computeSha256(bytes.buffer as ArrayBuffer)).resolves.toBe(expected);
  });

  it('sorts object keys recursively for a stable canonical payload', () => {
    const left: LotDigestInput = {
      producerName: 'Ana',
      timestamp: 1700000000,
      coordinates: { latitude: 17.1, longitude: -98.2 },
      community: 'Mixteca',
    };
    const right: LotDigestInput = {
      community: 'Mixteca',
      coordinates: { longitude: -98.2, latitude: 17.1 },
      timestamp: 1700000000,
      producerName: 'Ana',
    };

    expect(canonicalizeLotPayload(left)).toBe(canonicalizeLotPayload(right));
  });

  it('changes the digest when provenance changes', async () => {
    const base: LotDigestInput = { producerName: 'Ana', timestamp: 1700000000 };
    const changed: LotDigestInput = { ...base, timestamp: 1700000001 };

    await expect(CryptoEngine.generateCommunityDigest(base)).resolves.not.toBe(
      await CryptoEngine.generateCommunityDigest(changed),
    );
  });

  it('normalizes legacy audio and photo aliases', async () => {
    const legacy: LotDigestInput = {
      producerName: 'Ana',
      timestamp: 1700000000,
      audioBase64: 'audio',
      photoBase64: 'photo',
    };
    const current: LotDigestInput = {
      producerName: 'Ana',
      timestamp: 1700000000,
      audio: 'audio',
      photo: 'photo',
    };

    await expect(CryptoEngine.generateCommunityDigest(legacy)).resolves.toBe(
      await CryptoEngine.generateCommunityDigest(current),
    );
  });
});
