const enc = new TextEncoder();
const dec = new TextDecoder();

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

export type EncryptedData = { ciphertext: string; iv: string; salt: string };

export async function deriveKey(password: string, salt: Uint8Array) {
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt.buffer as ArrayBuffer, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptBackup(data: string, password: string): Promise<EncryptedData> {
  if (password.length < 8) throw new Error("Password must be at least 8 characters");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv.buffer as ArrayBuffer }, key, enc.encode(data));
  return { ciphertext: toBase64(new Uint8Array(encrypted)), iv: toBase64(iv), salt: toBase64(salt) };
}

export async function decryptBackup(encrypted: EncryptedData, password: string): Promise<string> {
  try {
    const iv = fromBase64(encrypted.iv);
    const salt = fromBase64(encrypted.salt);
    const data = fromBase64(encrypted.ciphertext);
    const key = await deriveKey(password, salt);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv.buffer as ArrayBuffer }, key, data.buffer as ArrayBuffer);
    return dec.decode(plain);
  } catch {
    throw new Error("WRONG_PASSWORD_OR_CORRUPT_DATA");
  }
}

export async function validatePassword(encrypted: EncryptedData, password: string) {
  try {
    await decryptBackup(encrypted, password);
    return true;
  } catch {
    return false;
  }
}
