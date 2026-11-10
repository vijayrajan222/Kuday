import { io, Socket } from 'socket.io-client';
import { storage } from '@/utils/storage';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socketInstance: Socket | null = null;

export const socketService = {
  connect(customToken?: string): Socket {
    const token = customToken || storage.getToken();
    const user = storage.getUser();

    if (socketInstance && socketInstance.connected) {
      return socketInstance;
    }

    if (socketInstance) {
      socketInstance.disconnect();
    }

    socketInstance = io(SOCKET_URL, {
      auth: {
        token: token || undefined,
        userId: user?.id || undefined,
      },
      query: {
        userId: user?.id || undefined,
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    return socketInstance;
  },

  getSocket(): Socket | null {
    if (!socketInstance) {
      const token = storage.getToken();
      if (token) {
        return this.connect(token);
      }
    }
    return socketInstance;
  },

  disconnect(): void {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
  },
};
