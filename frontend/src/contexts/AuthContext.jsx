import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const API_BASE_URL = 'http://localhost:3000/api';

  // Computed property for authentication status
  const isAuthenticated = !!user && !!token;

  // Initialize auth state
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  const register = async (userData) => {
    try {
      console.log('AuthContext register called with:', userData);
      
      // Validate required fields
      if (!userData.email || !userData.username || !userData.password) {
        throw new Error('Email, username, and password are required');
      }

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          username: userData.username,
          password: userData.password,
          role: userData.role || 'user'
        }),
      });

      const data = await response.json();
      
      console.log('Registration response:', response.status, data);

      if (!response.ok) {
        throw new Error(data.error || `Registration failed with status ${response.status}`);
      }

      // Store auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);

      return data;
    } catch (error) {
      console.error('Registration error in AuthContext:', error);
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      console.log('AuthContext login called with:', credentials);
      
      // Validate required fields
      if (!credentials.email || !credentials.password) {
        const errorMsg = 'Email and password are required';
        console.error('Login validation failed:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('Making login request to:', `${API_BASE_URL}/auth/login`);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        }),
      });

      console.log('Login response status:', response.status);

      const data = await response.json();
      console.log('Login response data:', data);

      if (!response.ok) {
        const errorMsg = data.error || `Login failed with status ${response.status}`;
        console.error('Login failed:', errorMsg);
        throw new Error(errorMsg);
      }

      // Store auth data
      console.log('Storing auth data...');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);

      console.log('Login successful in AuthContext');
      return { success: true, data };

    } catch (error) {
      console.error('Login error in AuthContext:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated, // Added this computed property
    register,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};