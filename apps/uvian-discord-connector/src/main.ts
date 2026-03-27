import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import autoload from '@fastify/autoload';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: true,
});

await fastify.register(sensible);

await fastify.register(autoload, {
  dir: path.join(__dirname, 'app/plugins'),
  options: { prefix: 'discord-connector' },
});

await fastify.register(autoload, {
  dir: path.join(__dirname, 'app/routes'),
  options: { prefix: 'discord-connector' },
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3003', 10);
    await fastify.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
