import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, LogIn, UserPlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

import { API_BASE } from "@/config/api";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [passwortWiederholen, setPasswortWiederholen] = useState("");
  const [fehler, setFehler] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Weiterleitung wenn bereits eingeloggt
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFehler("");
    setLoading(true);

    try {
      console.log('🔐 Attempting login to:', `${API_BASE}/login`);
      console.log('📧 Email:', email);
      
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, passwort }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        setFehler(data.nachricht || "Anmeldung fehlgeschlagen");
        setLoading(false);
        return;
      }

      login(data.token);
      navigate("/");
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Error type:', error.constructor.name);
      console.error('❌ Error message:', error.message);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setFehler(`Verbindungsfehler: ${error.message}. Prüfen Sie die Netzwerkverbindung.`);
      } else {
        setFehler(`Verbindungsfehler: ${error.message}`);
      }
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFehler("");

    if (passwort !== passwortWiederholen) {
      setFehler("Passwörter stimmen nicht überein");
      return;
    }

    if (passwort.length < 6) {
      setFehler("Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Attempting register to:', `${API_BASE}/register`);
      console.log('📧 Email:', email);
      
      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, passwort }),
      });

      console.log('📡 Register response status:', response.status);
      const data = await response.json();
      console.log('📦 Register response data:', data);

      if (!response.ok) {
        setFehler(data.nachricht || "Registrierung fehlgeschlagen");
        setLoading(false);
        return;
      }

      // Nach erfolgreicher Registrierung zum Login wechseln
      setActiveTab("login");
      setFehler("");
      setPasswort("");
      setPasswortWiederholen("");
      setLoading(false);
    } catch (error) {
      console.error('❌ Register error:', error);
      console.error('❌ Error type:', error.constructor.name);
      console.error('❌ Error message:', error.message);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setFehler(`Verbindungsfehler: ${error.message}. Prüfen Sie die Netzwerkverbindung.`);
      } else {
        setFehler(`Verbindungsfehler: ${error.message}`);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-2xl max-w-md w-full border border-border"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Lagerverwaltung
            </h1>
            <p className="text-muted-foreground">
              Bitte melden Sie sich an oder registrieren Sie sich
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Anmelden</TabsTrigger>
              <TabsTrigger value="register">Registrieren</TabsTrigger>
            </TabsList>

            {fehler && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{fehler}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-Mail-Adresse</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ihre@email.de"
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-passwort">Passwort</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-passwort"
                      type="password"
                      value={passwort}
                      onChange={(e) => setPasswort(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    "Bitte warten..."
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Anmelden
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">E-Mail-Adresse</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ihre@email.de"
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-passwort">Passwort</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-passwort"
                      type="password"
                      value={passwort}
                      onChange={(e) => setPasswort(e.target.value)}
                      placeholder="Mindestens 6 Zeichen"
                      className="pl-10"
                      required
                      minLength={6}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-passwort-wiederholen">
                    Passwort wiederholen
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-passwort-wiederholen"
                      type="password"
                      value={passwortWiederholen}
                      onChange={(e) => setPasswortWiederholen(e.target.value)}
                      placeholder="Passwort wiederholen"
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    "Bitte warten..."
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Registrieren
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
};

