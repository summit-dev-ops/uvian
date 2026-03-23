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
