"use client"
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import type { SocketEvents } from './types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000'; // Add a fallback for testing

interface SocketContextValue {
  socket: Socket<SocketEvents> | null;
  isConnected: boolean; // Useful to know connection status in UI
}

const SocketContext = createContext<SocketContextValue>({ socket: null, isConnected: false });

interface Props {
  children: ReactNode;
}

export const SocketProvider: React.FC<Props> = ({ children }) => {
  // 1. Use useState instead of useRef so the context updates when socket is ready
  const [socket, setSocket] = useState<Socket<SocketEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 2. Create the socket instance
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    // 3. Set up connection listeners for debugging/status
    socketInstance.on('connect', () => {
      console.log('🔌 Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
    });

    // 4. Save to state to trigger re-render of children
    setSocket(socketInstance);

    // 5. Cleanup
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);