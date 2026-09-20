import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CryptoEngine, LotDigestInput } from '../CryptoEngine';

describe('CryptoEngine - Canonical SHA-256 & Provenance Digest', () => {
  describe('computeSha256() Standard Test Vectors & Polymorphism', () => {
    it('matches NIST standard test vector for empty string', async () => {
      const hash = await CryptoEngine.computeSha256('');
      assert.equal(hash, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });

    it('matches NIST standard test vector for "hello world"', async () => {
      const hash = await CryptoEngine.computeSha256('hello world');
      assert.equal(hash, 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    });

    it('produces identical hash across string, Uint8Array, and ArrayBuffer inputs', async () => {
      const text = 'Mixteca Alta - Café Orgánico de Sombra';
      const encoder = new TextEncoder();
      const uint8 = encoder.encode(text);
      const arrayBuffer = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength);

      const hashStr = await CryptoEngine.computeSha256(text);
      const hashUint8 = await CryptoEngine.computeSha256(uint8);
      const hashBuf = await CryptoEngine.computeSha256(arrayBuffer);

      assert.equal(hashStr.length, 64);
      assert.equal(hashStr, hashUint8);
      assert.equal(hashStr, hashBuf);
    });

    it('throws TypeError when invoked with invalid input types', async () => {
      await assert.rejects(
        async () => {
          await CryptoEngine.computeSha256(12345 as any);
        },
        {
          name: 'TypeError',
          message: 'CryptoEngine.computeSha256 requires string, Uint8Array, or ArrayBuffer.'
        }
      );
    });
  });

  describe('canonicalizeLotPayload() Key Sorting & Float Normalization', () => {
    it('guarantees identical serialization regardless of dictionary key insertion order', () => {
      const payloadA = {
        cropType: 'cafe',
        producerId: 'prod_001',
        community: 'Santa María Yucuhiti',
        harvestTimestamp: 1726800000
      };

      const payloadB = {
        harvestTimestamp: 1726800000,
        community: 'Santa María Yucuhiti',
        cropType: 'cafe',
        producerId: 'prod_001'
      };

      const canonA = CryptoEngine.canonicalizeLotPayload(payloadA);
      const canonB = CryptoEngine.canonicalizeLotPayload(payloadB);

      assert.equal(canonA, canonB);
      assert.equal(canonA, '{"community":"Santa María Yucuhiti","cropType":"cafe","harvestTimestamp":1726800000,"producerId":"prod_001"}');
    });

    it('recursively sorts deeply nested dictionary keys', () => {
      const nestedA = {
        meta: { z: 1, a: 2, m: { y: 10, b: 20 } },
        producer: 'Doña Rosalba'
      };

      const nestedB = {
        producer: 'Doña Rosalba',
        meta: { m: { b: 20, y: 10 }, a: 2, z: 1 }
      };

      const canonA = CryptoEngine.canonicalizeLotPayload(nestedA);
      const canonB = CryptoEngine.canonicalizeLotPayload(nestedB);

      assert.equal(canonA, canonB);
      assert.equal(canonA, '{"meta":{"a":2,"m":{"b":20,"y":10},"z":1},"producer":"Doña Rosalba"}');
    });

    it('normalizes parcel coordinates to 5-decimal precision', () => {
      const lotWithHighPrecisionCoords = {
        parcelLocation: {
          latitude: 17.02718999999,
          longitude: -97.80123456789
        }
      };

      const lotWithStandardPrecision = {
        parcelLocation: {
          latitude: 17.02719,
          longitude: -97.80123
        }
      };

      const canonA = CryptoEngine.canonicalizeLotPayload(lotWithHighPrecisionCoords);
      const canonB = CryptoEngine.canonicalizeLotPayload(lotWithStandardPrecision);

      assert.equal(canonA, canonB);
      assert.equal(canonA, '{"parcelLocation":{"latitude":17.02719,"longitude":-97.80123}}');
    });

    it('preserves special indigenous characters (Tu\'un Savi & Zapotec variants)', () => {
      const indigenousPayload = {
        variant: 'Tu\'un Savi (Mixteco de la Costa)',
        community: 'San Juan Mixtepec',
        artisan: 'Ñuu Savi'
      };

      const canonical = CryptoEngine.canonicalizeLotPayload(indigenousPayload);
      assert.ok(canonical.includes("Tu'un Savi"));
      assert.ok(canonical.includes("Ñuu Savi"));
    });
  });

  describe('generateCommunityDigest() Immutable Provenance Passport', () => {
    it('generates identical SHA-256 digest for identical lot data with scrambled key orders', async () => {
      const lot1: LotDigestInput = {
        producerId: 'prod_mixteca_042',
        producerName: 'Don Eufemio Sánchez',
        community: 'Yosonotú',
        parcelLocation: {
          latitude: 17.05432,
          longitude: -97.65432,
          elevationMeters: 1850
        },
        cropType: 'cafe-alta-montana',
        harvestTimestamp: 1789876543,
        audioTestimonialSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        lotWeightKg: 120
      };

      const lot2: LotDigestInput = {
        lotWeightKg: 120,
        harvestTimestamp: 1789876543,
        cropType: 'cafe-alta-montana',
        audioTestimonialSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        community: 'Yosonotú',
        producerName: 'Don Eufemio Sánchez',
        parcelLocation: {
          elevationMeters: 1850,
          longitude: -97.65432,
          latitude: 17.05432
        },
        producerId: 'prod_mixteca_042'
      };

      const digest1 = await CryptoEngine.generateCommunityDigest(lot1);
      const digest2 = await CryptoEngine.generateCommunityDigest(lot2);

      assert.equal(digest1.length, 64);
      assert.equal(digest1, digest2);
    });

    it('detects tampering: modifying a coordinate alters the community digest', async () => {
      const original: LotDigestInput = {
        producerId: 'p1',
        producerName: 'Elena',
        community: 'Tlaxiaco',
        parcelLocation: { latitude: 17.26667, longitude: -97.68333 },
        cropType: 'telar-cintura',
        harvestTimestamp: 1789800000
      };

      const tampered: LotDigestInput = {
        ...original,
        parcelLocation: { latitude: 17.26668, longitude: -97.68333 }
      };

      const hashOrig = await CryptoEngine.generateCommunityDigest(original);
      const hashTamp = await CryptoEngine.generateCommunityDigest(tampered);

      assert.notEqual(hashOrig, hashTamp);
    });

    it('maintains backwards compatibility for legacy parameter format', async () => {
      const legacyParams = {
        producerName: 'Mateo Bautista',
        community: 'Chalcatongo',
        timestamp: 1789800000,
        audioBase64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEA',
        photoBase64: '/9j/4AAQSkZJRgABAQEASABIAAD'
      };

      const hash = await CryptoEngine.generateCommunityDigest(legacyParams);
      assert.equal(hash.length, 64);
      assert.match(hash, /^[0-9a-f]{64}$/);
    });
  });
});
