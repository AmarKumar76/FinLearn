import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore authenticated session on mount
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/auth/me');
      if (res && res.data && res.data.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      // 401 or network failure: user is unauthenticated
      setUser(null);
      localStorage.removeItem('finlearn_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res && res.data) {
        if (res.data.token) {
          localStorage.setItem('finlearn_token', res.data.token);
        }
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      throw new Error('Invalid login response from server');
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  // Register handler
  const register = async (name, email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      if (res && res.data) {
        if (res.data.token) {
          localStorage.setItem('finlearn_token', res.data.token);
        }
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      throw new Error('Invalid registration response from server');
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (err) {
      // Ignore logout errors and proceed to wipe client state
    } finally {
      localStorage.removeItem('finlearn_token');
      setUser(null);
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      const res = await api.patch('/auth/profile', profileData);
      if (res && res.data && res.data.user) {
        setUser(res.data.user);
        return res.data.user;
      }
      throw new Error('Failed to update profile');
    } catch (err) {
      throw err;
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await api.post('/auth/change-password', { currentPassword, newPassword });
      if (res && res.data && res.data.token) {
        localStorage.setItem('finlearn_token', res.data.token);
      }
      if (res && res.data && res.data.user) {
        setUser(res.data.user);
      }
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    return api.post('/auth/forgot-password', { email });
  };

  // Reset password
  const resetPassword = async (token, newPassword) => {
    return api.post('/auth/reset-password', { token, newPassword });
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    loading,
    error,
    login,
    register,
    logout,
    checkAuth,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
