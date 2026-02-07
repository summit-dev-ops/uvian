import React from 'react';
import { ChatView } from '~/components/features/chat/components/chat-view';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  return (
    <ChatView conversationId={conversationId} />
  );
}
