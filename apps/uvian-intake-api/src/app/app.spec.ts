import Fastify, { FastifyInstance } from 'fastify';
import { app } from './app';

describe('GET /health', () => {
  let server: FastifyInstance;

  beforeEach(() => {
    server = Fastify();
    server.register(app);
  });

  it('should respond with ok status', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    const body = response.json();
    expect(body.status).toEqual('ok');
    expect(body.timestamp).toBeDefined();
  });
});
