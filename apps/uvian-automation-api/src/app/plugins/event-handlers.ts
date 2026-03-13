import fp from 'fastify-plugin';
import { registerAllEventHandlers } from '../services/event-handlers';

export default fp(async (fastify) => {
  registerAllEventHandlers();
  fastify.log.info('Event handlers registered');
});
