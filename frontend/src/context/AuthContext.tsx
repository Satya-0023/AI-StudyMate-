import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../utils/api'; // Import the new fetch-based utility

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest('/api/auth/login', 'POST', {
        email,
        password,
      });

      const { access_token, user: userData } = response.data;

      await AsyncStorage.setItem('authToken', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setToken(access_token);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.detail || error.message || 'Login failed');
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await apiRequest('/api/auth/register', 'POST', {
        email,
        password,
      });

      const { access_token, user: userData } = response.data;

      await AsyncStorage.setItem('authToken', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setToken(access_token);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.detail || error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const deleteAccount = async () => {
    try {
      await apiRequest('/api/auth/delete-account', 'DELETE', undefined, token || undefined);

      await logout();
    } catch (error: any) {
      throw new Error(error.detail || error.message || 'Failed to delete account');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
