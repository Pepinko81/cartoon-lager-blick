import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Benutzer {
  id: string;
  email: string;
}

interface AuthContextType {
  token: string | null;
  benutzer: Benutzer | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
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

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem(TOKEN_KEY, newToken);
    // Benutzer-Info aus Token extrahieren
    try {
      const payload = JSON.parse(atob(newToken.split(".")[1]));
      setBenutzer({ id: payload.id.toString(), email: payload.email });
    } catch (error) {
      console.error("Fehler beim Decodieren des Tokens:", error);
    }
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
