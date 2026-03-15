import { createContext, useReducer, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

export const AuthContext = createContext();

const initialState = {
  isAuthenticated: false,
  user: null,
  isInitialized: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user,
        isInitialized: true,
      };
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: { ...state.user, profile: { ...state.user.profile, ...action.payload } }
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: false, user: null } });
          return;
        }
        
        const { data } = await api.get('/auth/me');
        dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: true, user: data.data.user } });
      } catch (err) {
        dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: false, user: null } });
      }
    };
    initAuth();

    // Listen for auth:logout event emitted by api interceptor or socket
    const handleLogout = () => {
      dispatch({ type: 'LOGOUT' });
      navigate('/login');
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [navigate]);

  const login = (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    dispatch({ type: 'LOGIN', payload: { user } });
    navigate('/');
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'LOGOUT' });
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
