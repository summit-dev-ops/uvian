export async function importPublicKey(pemKey: string): Promise<CryptoKey> {
  const pemContents = pemKey
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  return await crypto.subtle.importKey(
    'spki',
    binaryDer.buffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  );
}

export async function encryptWithPublicKey(
  plaintext: string,
  publicKey: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    data
  );

  const encryptedArray = new Uint8Array(encrypted);
  const base64Chars = Array.from(encryptedArray, (byte) =>
    String.fromCharCode(byte)
  ).join('');
  return btoa(base64Chars);
}

export async function encryptSecretFields(
  payload: Record<string, unknown>,
  secretFieldNames: string[],
  publicKey: CryptoKey
): Promise<Record<string, unknown>> {
  const encryptedPayload = { ...payload };

  for (const fieldName of secretFieldNames) {
    const value = encryptedPayload[fieldName];
    if (value !== undefined && value !== null) {
      encryptedPayload[fieldName] = await encryptWithPublicKey(
        String(value),
        publicKey
      );
    }
  }

  return encryptedPayload;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chars = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(chars);
}

export async function generateAesKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

function generateIv(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

export async function encryptWithAes(
  data: Record<string, unknown>,
  aesKey: CryptoKey
): Promise<{ ciphertext: ArrayBuffer; iv: ArrayBuffer }> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(JSON.stringify(data));

  const iv = generateIv();

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    aesKey,
    dataBytes
  );

  return { ciphertext, iv: iv.buffer as ArrayBuffer };
}

export async function encryptAesKeyWithPublicKey(
  aesKey: CryptoKey,
  publicKey: CryptoKey
): Promise<ArrayBuffer> {
  const rawKey = await crypto.subtle.exportKey('raw', aesKey);

  const encryptedKey = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    rawKey
  );

  return encryptedKey;
}

export interface HybridEncryptedPayload {
  encryptedPayload: string;
  encryptedKey: string;
  iv: string;
}

export async function encryptPayload(
  payload: Record<string, unknown>,
  publicKey: CryptoKey
): Promise<HybridEncryptedPayload> {
  const aesKey = await generateAesKey();

  const { ciphertext, iv } = await encryptWithAes(payload, aesKey);

  const encryptedKey = await encryptAesKeyWithPublicKey(aesKey, publicKey);

  return {
    encryptedPayload: arrayBufferToBase64(ciphertext),
    encryptedKey: arrayBufferToBase64(encryptedKey),
    iv: arrayBufferToBase64(iv),
  };
}
