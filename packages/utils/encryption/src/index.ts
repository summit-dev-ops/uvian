import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

function getKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret).digest();
}

export function encrypt(plaintext: string, secret: string): string {
  const key = getKey(secret);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string, secret: string): string {
  const key = getKey(secret);
  const [ivHex, encHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function decryptJson<T = unknown>(encrypted: string, secret: string): T {
  const plaintext = decrypt(encrypted, secret);
  return JSON.parse(plaintext) as T;
}

export interface RSAKeyPair {
  publicKey: string;
  privateKey: string;
}

export function generateRSAKeyPair(): RSAKeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });
  return { publicKey, privateKey };
}

export function decryptRSA(ciphertext: string, privateKey: string): string {
  const buffer = Buffer.from(ciphertext, 'base64');
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buffer,
  );
  return decrypted.toString('utf8');
}

export interface HybridEncryptedSubmission {
  encryptedPayload: string;
  encryptedKey: string;
  iv: string;
}

export interface DecryptedSubmission {
  data: Record<string, unknown>;
}

export function decryptHybridSubmission(
  submission: HybridEncryptedSubmission,
  privateKey: string,
): DecryptedSubmission {
  console.log('[decrypt] Starting decryption', {
    hasKey: !!privateKey,
    keyLength: privateKey?.length,
    payloadKeys: Object.keys(submission),
    encryptedPayloadLength: submission.encryptedPayload?.length,
    encryptedKeyLength: submission.encryptedKey?.length,
    ivLength: submission.iv?.length,
  });

  try {
    const encryptedPayload = Buffer.from(submission.encryptedPayload, 'base64');
    const encryptedKey = Buffer.from(submission.encryptedKey, 'base64');
    const iv = Buffer.from(submission.iv, 'base64');

    console.log('[decrypt] Buffers created', {
      payloadLen: encryptedPayload.length,
      keyLen: encryptedKey.length,
      ivLen: iv.length,
    });

    const decryptedAesKey = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      encryptedKey,
    );

    console.log(
      '[decrypt] RSA decrypted, AES key length:',
      decryptedAesKey.length,
    );

    const authTag = encryptedPayload.subarray(encryptedPayload.length - 16);
    const ciphertext = encryptedPayload.subarray(
      0,
      encryptedPayload.length - 16,
    );

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      decryptedAesKey,
      iv,
    );
    decipher.setAuthTag(authTag);

    const chunks: Buffer[] = [];
    const decrypted = decipher.update(ciphertext);
    if (decrypted) chunks.push(decrypted);
    const final = decipher.final('utf8');
    if (final) chunks.push(Buffer.from(final));

    const decryptedJsonString = Buffer.concat(chunks).toString('utf8');

    console.log('[decrypt] AES decrypted, raw string:', decryptedJsonString);
    console.log('[decrypt] Raw string length:', decryptedJsonString.length);

    const data = JSON.parse(decryptedJsonString);
    console.log('[decrypt] Success, parsed data:', data);
    return { data };
  } catch (error) {
    console.error('[decrypt] FAILED:', error);
    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
