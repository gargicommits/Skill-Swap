import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getStoredToken, setStoredToken } from '../services/api';
import { NotificationItem, SafeUser } from '../types';

interface AuthContextType {
  currentUser: SafeUser | null;
  isLoading: boolean;
  error: string | null;
  notifications: NotificationItem[];
  unreadCount: number;
  login: (identifier: string, pass: string) => Promise<void>;
  registerStudent: (payload: any) => Promise<void>;
  registerSenior: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  quickLoginDemo: (role: 'student' | 'senior-approved' | 'senior-pending' | 'admin-anchal' | 'admin-gargi' | 'admin-shreya' | 'admin-shravani') => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshNotifications = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.notifications.filter((n) => !n.isRead).length);
    } catch {
      // Quiet fail for polling
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.getCurrentUser();
      setCurrentUser(res.user);
      setUnreadCount(res.unreadNotificationsCount || 0);
      refreshNotifications();
    } catch (err: any) {
      console.warn('Session expired or invalid:', err.message);
      setStoredToken(null);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshNotifications]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (identifier: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.login({ identifier, password: pass });
      setStoredToken(res.token);
      setCurrentUser(res.user);
      await refreshNotifications();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerStudent = async (payload: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.registerStudent(payload);
      setStoredToken(res.token);
      setCurrentUser(res.user);
      await refreshNotifications();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerSenior = async (payload: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.registerSenior(payload);
      setStoredToken(res.token);
      setCurrentUser(res.user);
      await refreshNotifications();
    } catch (err: any) {
      setError(err.message || 'Senior registration failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setStoredToken(null);
      setCurrentUser(null);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Quick Switcher for College Evaluator & Demo
  const quickLoginDemo = async (
    target: 'student' | 'senior-approved' | 'senior-pending' | 'admin-anchal' | 'admin-gargi' | 'admin-shreya' | 'admin-shravani'
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      let identifier = '';
      let password = '';

      switch (target) {
        case 'student':
          identifier = 'SCOE2401'; // Aryan Mehta (FE Student)
          password = 'Student@123';
          break;
        case 'senior-approved':
          identifier = 'SCOE2101'; // Rohan Sharma (Approved TE Senior Mentor)
          password = 'Senior@123';
          break;
        case 'senior-pending':
          identifier = 'SCOE2240'; // Tanmay Joshi (Pending SE Senior Mentor)
          password = 'Senior@123';
          break;
        case 'admin-anchal':
          identifier = 'SCOA09'; // Anchal Singh (Authorized Admin 1)
          password = 'Admin@SCOA2026';
          break;
        case 'admin-gargi':
          identifier = 'SCOA11'; // Gargi Bhothre (Authorized Admin 2)
          password = 'Admin@SCOA2026';
          break;
        case 'admin-shreya':
          identifier = 'SCOA20'; // Shreya Ashtaker (Authorized Admin 3)
          password = 'Admin@SCOA2026';
          break;
        case 'admin-shravani':
          identifier = 'SCOA21'; // Shravani Deshmukh (Authorized Admin 4)
          password = 'Admin@SCOA2026';
          break;
      }

      const res = await api.login({ identifier, password });
      setStoredToken(res.token);
      setCurrentUser(res.user);
      await refreshNotifications();
    } catch (err: any) {
      setError(`Quick demo switch failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        error,
        notifications,
        unreadCount,
        login,
        registerStudent,
        registerSenior,
        logout,
        refreshUser,
        refreshNotifications,
        quickLoginDemo,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
