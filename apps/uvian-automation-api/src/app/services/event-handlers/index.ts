import { webhookHandlerService } from '../webhook-handler.service';
import { registerChatHandlers } from './chat.handlers';
import { registerAutomationHandlers } from './automation.handlers';
import { registerContentHandlers } from './content.handlers';
import { registerTicketHandlers } from './ticket.handlers';
import { registerSpaceHandlers } from './space.handlers';
import { registerConversationEventHandlers } from './conversation.handlers';
import { registerDiscordHandlers } from './discord.handlers';
import { registerMcpProvisioningHandlers } from './mcp-provisioning.handlers';
import { registerScheduleHandlers } from './schedule.handlers';

export function registerAllEventHandlers() {
  registerChatHandlers(webhookHandlerService);
  registerAutomationHandlers(webhookHandlerService);
  registerContentHandlers(webhookHandlerService);
  registerTicketHandlers(webhookHandlerService);
  registerSpaceHandlers(webhookHandlerService);
  registerDiscordHandlers(webhookHandlerService);
  registerMcpProvisioningHandlers(webhookHandlerService);
  registerScheduleHandlers(webhookHandlerService);

  const conversationHandlers = registerConversationEventHandlers();
  for (const { eventType, handler } of conversationHandlers) {
    webhookHandlerService.registerHandler(eventType, handler);
  }
}

export * from './chat.handlers';
export * from './automation.handlers';
export * from './content.handlers';
export * from './ticket.handlers';
export * from './space.handlers';
export * from './conversation.handlers';
export * from './discord.handlers';
export * from './mcp-provisioning.handlers';
export * from './schedule.handlers';
