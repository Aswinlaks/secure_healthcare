const { encrypt, decrypt } = require('../utils/encryption');
const crypto = require('crypto');

describe('Encryption Utility', () => {
    const originalEnv = process.env;

    beforeAll(() => {
        process.env = { ...originalEnv };
        process.env.ENCRYPTION_KEY = '12345678901234567890123456789012'; // 32 chars
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('encrypt', () => {
        it('should encrypt data and return in format iv:ciphertext', () => {
            const data = 'sensitive data';
            const encrypted = encrypt(data);

            expect(typeof encrypted).toBe('string');
            expect(encrypted).toContain(':');

            const parts = encrypted.split(':');
            expect(parts.length).toBe(2);
            expect(parts[0]).toHaveLength(32); // 16 bytes hex = 32 chars
        });

        it('should return different outputs for same input (random IV)', () => {
            const data = 'same data';
            const enc1 = encrypt(data);
            const enc2 = encrypt(data);

            expect(enc1).not.toBe(enc2);
        });
    });

    describe('decrypt', () => {
        it('should decrypt encrypted data back to original', () => {
            const data = 'secret message';
            const encrypted = encrypt(data);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(data);
        });

        it('should throw error/fail for invalid key or corrupted data', () => {
            // This behavior depends on crypto implementation, usually throws
            const badCipertext = '00000000000000000000000000000000:invalidhex';

            expect(() => {
                decrypt(badCipertext);
            }).toThrow();
        });
    });
});
