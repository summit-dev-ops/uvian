"use client"
import React, { useEffect, useState } from 'react';
import { useChatSocket } from '~/components/providers/socket/useChatSocket';
import { Button, Input, Card, CardContent } from "@org/ui";

export default function ChatPage() {
  const { joinConversation, sendMessage, onNewMessage, isConnected } = useChatSocket();
  const [conversationId] = useState('hi');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: string; text: string }>>([]);

  // 1. Join the room ONLY when the socket is actually connected
  useEffect(() => {
    if (!isConnected) return; // Wait for connection

    console.log("Joining conversation...");
    joinConversation({ conversationId });

    const cleanup = onNewMessage((payload) => {
      console.log("Received message:", payload);
      setMessages((prev) => [...prev, { sender: payload.sender, text: payload.text }]);
    });

    return cleanup;
  }, [isConnected, joinConversation, onNewMessage, conversationId]);

  const handleSend = () => {
    if (!text.trim() || !isConnected) return;
    
    const payload = { conversationId, text, sender: 'client' };
    sendMessage(payload);
    
    // Optimistic UI update
    setMessages((prev) => [...prev, { sender: 'me', text }]);
    setText('');
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">Chat Demo (room: {conversationId})</h2>
      
      {/* Visual Indicator */}
      <div className="mb-2 text-xs">
        Status: {isConnected ? <span className="text-green-600">● Connected</span> : <span className="text-red-600">● Disconnected</span>}
      </div>

      <Card className="mb-4">
        <CardContent className="h-80 overflow-y-auto p-2">
          {messages.map((msg, idx) => (
            <div key={idx} className="mb-1">
              <strong>{msg.sender}:</strong> {msg.text}
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex items-center space-x-2 mb-4">
        <Input
          type="text"
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message"
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={!isConnected}>Send</Button>
      </div>
    </div>
  );
}