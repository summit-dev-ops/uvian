export {};

declare module 'fastify' {
  export interface FastifyInstance {
    authenticate: (request: unknown, reply: unknown) => Promise<void>;
    authenticateOptional: (request: unknown, reply: unknown) => Promise<void>;
    authenticateInternal: (request: unknown, reply: unknown) => Promise<void>;
  }
}
