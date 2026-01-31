"use client"
import React, { useEffect, useState } from 'react';
import { useChatSocket } from '../socket/useChatSocket';

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
    <div style={{ padding: '1rem' }}>
      <h2>Chat Demo (room: {conversationId})</h2>
      
      {/* Visual Indicator */}
      <div style={{ marginBottom: '10px', fontSize: '12px' }}>
        Status: {isConnected ? <span style={{color:'green'}}>● Connected</span> : <span style={{color:'red'}}>● Disconnected</span>}
      </div>

      <div style={{ border: '1px solid #ccc', padding: '0.5rem', height: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: '0.5rem' }}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder="Type a message"
        style={{ width: '70%', marginRight: '0.5rem' }}
      />
      <button onClick={handleSend} disabled={!isConnected}>Send</button>
    </div>
  );
}