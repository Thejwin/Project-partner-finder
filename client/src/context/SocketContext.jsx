import { createContext, useEffect, useState, useContext } from 'react';
import { connectSocket, disconnectSocket } from '../config/socket';
import { useAuth } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const s = connectSocket(token);
    
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    
    setSocket(s);

    return () => {
      disconnectSocket();
      setConnected(false);
      setSocket(null);
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

// Hook to automatically subscribe/unsubscribe to socket events
export const useSocketEvent = (event, handler, deps = []) => {
  const { socket } = useContext(SocketContext);
  
  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => socket.off(event, handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, event, ...deps]);
};
