// @ts-nocheck
import { encrypt, decrypt } from "@/lib/encryption";
import { describe, it, expect } from "vitest";

describe("encryption helper", () => {
    it("should decrypt the same text it encrypts", () => {
        const plain = "hello world";
        const cipher = encrypt(plain);
        const recovered = decrypt(cipher);
        expect(recovered).toBe(plain);
    });
}); 