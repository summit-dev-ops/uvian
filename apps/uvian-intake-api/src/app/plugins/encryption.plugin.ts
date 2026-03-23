import crypto from 'crypto';
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    encryption: EncryptionService;
  }
}

export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;

  constructor(secret: string) {
    this.key = crypto.createHash('sha256').update(secret).digest();
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(encrypted: string): string {
    const [ivHex, encHex] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  encryptFields(
    payload: Record<string, unknown>,
    fieldNames: string[]
  ): Record<string, string> {
    const encrypted: Record<string, string> = {};
    for (const field of fieldNames) {
      if (payload[field] !== undefined && payload[field] !== null) {
        encrypted[field] = this.encrypt(String(payload[field]));
      }
    }
    return encrypted;
  }
}

async function encryptionPlugin(fastify: FastifyInstance) {
  const secret = process.env.INTAKE_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('INTAKE_ENCRYPTION_KEY must be defined');
  }
  const encryption = new EncryptionService(secret);
  fastify.decorate('encryption', encryption);
}

export default fp(encryptionPlugin);
