import React, { createContext, useContext, useState, useEffect } from "react";

type AuthMode = "LOCAL" | "SESSION" | "NONE";

interface AuthContextProps {
  token: string | null;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  setToken: (token: string) => void;
  clearToken: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Inicjalizujemy tryb z localStorage lub ustawiamy domyślny na 'LOCAL'
  const initialAuthMode =
    (localStorage.getItem("authMode") as AuthMode) || "LOCAL";
  const [authMode, setAuthModeState] = useState<AuthMode>(initialAuthMode);

  // Inicjalizujemy token na podstawie trybu sesji
  const initialToken =
    authMode === "LOCAL"
      ? localStorage.getItem("token")
      : authMode === "SESSION"
      ? sessionStorage.getItem("token")
      : null;

  const [token, setTokenState] = useState<string | null>(initialToken);

  // Reagujemy na zmianę trybu i zapisujemy go w localStorage
  useEffect(() => {
    console.log(`[AuthContext] Initializing token for mode: ${authMode}`);
    localStorage.setItem("authMode", authMode); // Zapamiętujemy tryb w localStorage

    if (authMode === "LOCAL") {
      const localToken = localStorage.getItem("token");
      setTokenState(localToken);
      console.log(
        `[AuthContext] Loaded token from localStorage: ${localToken}`
      );
    } else if (authMode === "SESSION") {
      const sessionToken = sessionStorage.getItem("token");
      setTokenState(sessionToken);
      console.log(
        `[AuthContext] Loaded token from sessionStorage: ${sessionToken}`
      );
    } else {
      setTokenState(null);
      console.log(`[AuthContext] Token cleared for mode NONE`);
    }
  }, [authMode]);

  const setAuthMode = (mode: AuthMode) => {
    console.log(`[AuthContext] Setting auth mode to: ${mode}`);
    setAuthModeState(mode);
    localStorage.setItem("authMode", mode); // Zapamiętujemy tryb w localStorage
  };

  const setToken = (newToken: string) => {
    console.log(
      `[AuthContext] Setting token: ${newToken} for mode: ${authMode}`
    );
    if (authMode === "LOCAL") {
      localStorage.setItem("token", newToken);
      console.log(`[AuthContext] Token saved to localStorage`);
    } else if (authMode === "SESSION") {
      sessionStorage.setItem("token", newToken);
      console.log(`[AuthContext] Token saved to sessionStorage`);
    }
    setTokenState(newToken);
  };

  const clearToken = () => {
    console.log(`[AuthContext] Clearing token`);
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setTokenState(null);
  };

  useEffect(() => {
    console.log(`[AuthContext] Token updated: ${token}`);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{ token, authMode, setAuthMode, setToken, clearToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
