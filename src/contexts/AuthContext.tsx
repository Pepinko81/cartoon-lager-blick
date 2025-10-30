import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { API_BASE } from "@/config/api";

interface Benutzer {
  id: string;
  email: string;
}

interface AuthContextType {
  token: string | null;
  benutzer: Benutzer | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => void;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getAuthHeader: () => HeadersInit;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "lager_token";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [benutzer, setBenutzer] = useState<Benutzer | null>(null);

  // Token aus localStorage laden beim Start
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      setToken(savedToken);
      // Benutzer-Info aus Token extrahieren (decode JWT)
      try {
        const payload = JSON.parse(atob(savedToken.split(".")[1]));
        setBenutzer({ id: payload.id.toString(), email: payload.email });
      } catch (error) {
        // Token ungültig, löschen
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Backend erwartet deutsches Feld 'passwort'
      body: JSON.stringify({ email, passwort: password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login fehlgeschlagen");
    }

    const data = await response.json();
    const newToken = data.token;
    loginWithToken(newToken);
  };

  const loginWithToken = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem(TOKEN_KEY, newToken);
    try {
      const payload = JSON.parse(atob(newToken.split(".")[1]));
      setBenutzer({ id: payload.id.toString(), email: payload.email });
    } catch (error) {
      console.error("Fehler beim Decodieren des Tokens:", error);
    }
  };

  const register = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Backend erwartet deutsches Feld 'passwort'
      body: JSON.stringify({ email, passwort: password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registrierung fehlgeschlagen");
    }

    const data = await response.json();
    const newToken = data.token;
    loginWithToken(newToken);
  };

  const logout = () => {
    setToken(null);
    setBenutzer(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  const getAuthHeader = (): HeadersInit => {
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
    return {};
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        benutzer,
        isAuthenticated: !!token,
        login,
        loginWithToken,
        register,
        logout,
        getAuthHeader,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth muss innerhalb eines AuthProvider verwendet werden");
  }
  return context;
};
