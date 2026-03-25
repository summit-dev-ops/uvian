import Fastify from 'fastify';
import cors from '@fastify/cors';
import { app } from './app/app';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 8002;

const server = Fastify({
  logger: true,
});

server.register(cors, {
  origin: true,
  credentials: true,
});

server.register(app);

server.listen({ port, host }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});
