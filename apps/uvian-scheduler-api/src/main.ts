import Fastify from 'fastify';
import { app } from './app/app';
import cors from '@fastify/cors';

const host = process.env.HOST ?? '0.0.0.0';
const port = process.env.PORT ? Number(process.env.PORT) : 3003;

const server = Fastify({
  logger: true,
});

server.register(cors, {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
});

server.register(app);

server.listen({ port, host }, (err) => {
  if (err) {
    console.error('Server failed to start:', err);
    process.exit(1);
  } else {
    console.log(`[ ready ] http://${host}:${port}`);
  }
});
