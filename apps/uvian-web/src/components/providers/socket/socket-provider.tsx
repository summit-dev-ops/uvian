'use client';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import type { SocketEvents } from './types';
import { useAuth } from '~/lib/auth/auth-context';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000'; // Add a fallback for testing

interface SocketContextValue {
  socket: Socket<SocketEvents> | null;
  isConnected: boolean; // Useful to know connection status in UI
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

interface Props {
  children: ReactNode;
}

export const SocketProvider: React.FC<Props> = ({ children }) => {
  // 1. Use useState instead of useRef so the context updates when socket is ready
  const [socket, setSocket] = useState<Socket<SocketEvents> | null>(null);
  const { activeProfileId } = useUserSessionStore();
  const [isConnected, setIsConnected] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    if (!session) {
      // If no session, disconnect socket if it exists
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // 2. Create the socket instance with authentication
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      auth: {
        token: session.access_token,
        profileId: activeProfileId,
      },
    });

    // 3. Set up connection listeners for debugging/status
    socketInstance.on('connect', () => {
      console.log('🔌 Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error.message);
      setIsConnected(false);
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
  }, [session]); // Reconnect when session changes (login/logout/token refresh)

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
