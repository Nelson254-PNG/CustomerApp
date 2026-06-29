// ============================================================
//  context/AuthContext.tsx
//  Same pattern as the admin app's AuthContext — stores token,
//  role, and userId; persists via AsyncStorage so login
//  survives app restarts.
// ============================================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  token: string | null;
  userId: string | null;   // this customer's OWN id — used as "myId" everywhere
  loading: boolean;
  login: (token: string, userId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  token: null,
  userId: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

const TOKEN_KEY = "customer_app_token";
const USERID_KEY = "customer_app_userId";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedUserId = await AsyncStorage.getItem(USERID_KEY);
        if (storedToken && storedUserId) {
          setToken(storedToken);
          setUserId(storedUserId);
        }
      } finally {
        setLoading(false);
      }
    }
    loadStoredAuth();
  }, []);

  const login = async (newToken: string, newUserId: string) => {
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    await AsyncStorage.setItem(USERID_KEY, newUserId);
    setToken(newToken);
    setUserId(newUserId);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USERID_KEY]);
    setToken(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ token, userId, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}