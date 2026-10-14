import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User, Employee } from '../types';

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  token: string | null;
  login: (token: string, user: User, employee: Employee | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('hippo_token'));
  const [user, setUser] = useState<User | null>(
    localStorage.getItem('hippo_user') ? JSON.parse(localStorage.getItem('hippo_user')!) : null
  );
  const [employee, setEmployee] = useState<Employee | null>(
    localStorage.getItem('hippo_employee') ? JSON.parse(localStorage.getItem('hippo_employee')!) : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = (newToken: string, newUser: User, newEmployee: Employee | null) => {
    setToken(newToken);
    setUser(newUser);
    setEmployee(newEmployee);
    localStorage.setItem('hippo_token', newToken);
    localStorage.setItem('hippo_user', JSON.stringify(newUser));
    if (newEmployee) {
      localStorage.setItem('hippo_employee', JSON.stringify(newEmployee));
    } else {
      // Don't leak a previous session's employee profile into this one.
      localStorage.removeItem('hippo_employee');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setEmployee(null);
    localStorage.removeItem('hippo_token');
    localStorage.removeItem('hippo_user');
    localStorage.removeItem('hippo_employee');
  };

  return (
    <AuthContext.Provider value={{ user, employee, token, login, logout, isLoading }}>
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
