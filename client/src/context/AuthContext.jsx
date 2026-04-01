import React, { createContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;

    const parsedUser = JSON.parse(storedUser);
    if (!parsedUser?.token) return null;

    try {
      const response = await axiosInstance.get('/auth/me');
      const hydratedUser = {
        ...response.data,
        token: parsedUser.token,
      };
      localStorage.setItem('user', JSON.stringify(hydratedUser));
      setUser(hydratedUser);
      return hydratedUser;
    } catch (error) {
      localStorage.removeItem('user');
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    const hydrateUser = async () => {
      // Check if user is logged in
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        setLoading(false);
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser?.token) {
        localStorage.removeItem('user');
        setLoading(false);
        return;
      }

      await refreshUser();
      setLoading(false);
    };

    hydrateUser();
  }, []);

  useEffect(() => {
    if (!user?.token) return undefined;

    const interval = setInterval(() => {
      refreshUser();
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.token]);

  const login = async (userData) => {
    const payload = {
      email: userData?.email,
      password: userData?.password,
    };

    const response = await axiosInstance.post('/auth/login', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
      setUser(response.data);
    }
    return response.data;
  };

  const register = async (userData) => {
    const payload = {
      username: userData?.username,
      email: userData?.email,
      password: userData?.password,
    };

    const response = await axiosInstance.post('/auth/register', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
      setUser(response.data);
    }
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
