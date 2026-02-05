import React, { Suspense } from 'react';
import { ChatView } from '~/components/features/chat/components/chat-view';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          Loading chat...
        </div>
      }
    >
      <ChatView conversationId={conversationId} />
    </Suspense>
  );
}
