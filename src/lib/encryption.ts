import crypto from "crypto";

const ENCRYPTION_KEY = (process.env.ENCRYPTION_SECRET_KEY || "CHANGE_ME_32_BYTE_LONG_SECRET__")
    .padEnd(32, "0")
    .slice(0, 32); // Ensure exactly 32-byte key
const IV_LENGTH = 12; // 96-bit nonce recommended for GCM

/**
 * Encrypt plain text and return base64(ciphertext)::base64(iv)::base64(tag)
 */
export function encrypt(plain: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY), iv);
    const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [encrypted.toString("base64"), iv.toString("base64"), tag.toString("base64")].join("::");
}

/**
 * Decrypt a value produced by encrypt()
 */
export function decrypt(payload: string): string {
    const [cipherTextB64, ivB64, tagB64] = payload.split("::");
    if (!cipherTextB64 || !ivB64 || !tagB64) throw new Error("Invalid encrypted payload format");
    const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY), Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(cipherTextB64, "base64")), decipher.final()]);
    return decrypted.toString("utf8");
} 