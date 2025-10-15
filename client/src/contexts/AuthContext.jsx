import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { ErrorLogger } from '../utils/errorLogger';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
          try {
            // Parse user data safely
            let user;
            try {
              user = JSON.parse(userData);
            } catch (parseError) {
              console.error('Invalid user data in localStorage:', parseError);
              throw new Error('Invalid stored user data');
            }
            
            // Verify token is still valid
            const response = await authAPI.getProfile();
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: response.data.data.user,
                token,
              },
            });
          } catch (error) {
            // Token is invalid or expired, clear everything
            console.log('Token validation failed:', error.message);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.clear();
            dispatch({ type: 'LOGOUT' });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear everything on initialization error
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();
        dispatch({ type: 'LOGOUT' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Clear any existing auth data first
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // Validate credentials client-side
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }
      
      const response = await authAPI.login(credentials);
      
      // Validate response structure
      if (!response.data?.data?.user || !response.data?.data?.token) {
        throw new Error('Invalid response from server');
      }
      
      const { user, token } = response.data.data;

      // Log token payload for debugging
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('Login: Token payload received:', payload);
        }
      } catch (e) {
        console.warn('Could not decode token for debugging:', e);
      }

      // Store new auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      });

      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      ErrorLogger.logAuthError(error, 'login');
      
      // Clear any auth data on failed login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      let message = 'Login failed';
      
      // Handle different types of errors
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        message = 'Network error. Please check your connection and try again.';
      } else if (error.response?.status === 429) {
        message = 'Too many login attempts. Please try again later.';
      } else if (error.response?.status === 500) {
        message = 'Server error. Please try again later.';
      } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Format validation errors for display
        const validationErrors = error.response.data.errors;
        message = validationErrors.map(err => err.msg).join('. ');
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      
      dispatch({ type: 'SET_ERROR', payload: message });
      return { success: false, message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const logout = useCallback(async (silent = false) => {
    try {
      // Clear state immediately for better UX
      dispatch({ type: 'LOGOUT' });
      
      // Try to call server logout if token exists
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await authAPI.logout();
        } catch (error) {
          // Server logout failed, but continue with client cleanup
          console.warn('Server logout failed:', error.message);
        }
      }
      
      // Clear all authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // Clear any cookies that might exist
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      if (!silent) {
        // Redirect to login page
        window.location.href = '/login';
      }
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      ErrorLogger.logAuthError(error, 'logout');
      
      // Even if logout fails, clear local data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      dispatch({ type: 'LOGOUT' });
      
      if (!silent) {
        window.location.href = '/login';
      }
      
      return { success: false, message: 'Logout completed with errors' };
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.register(userData);
      
      // Don't automatically log in - just return success
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: true, message: 'Registration successful! Please log in with your credentials.' };
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      
      let message = 'Registration failed';
      
      // Handle validation errors from express-validator
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Format validation errors for display
        const validationErrors = error.response.data.errors;
        message = validationErrors.map(err => err.msg).join('. ');
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      dispatch({ type: 'SET_ERROR', payload: message });
      return { success: false, message };
    }
  }, []);

  const updateProfile = useCallback(async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data.data.user;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      
      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      return { success: false, message };
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const value = {
    ...state,
    login,
    logout,
    register,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
