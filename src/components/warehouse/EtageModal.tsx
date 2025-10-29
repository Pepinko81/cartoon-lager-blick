import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Etage {
  id: string;
  nummer: number;
  name?: string;
  faecher: Array<{ id: string; bezeichnung: string }>;
}

interface EtageModalProps {
  isOpen: boolean;
  onClose: () => void;
  rackId: string;
  rackName: string;
  etagen: Etage[];
  onEtagenChange: () => void;
}

import { API_BASE } from "@/config/api";

export const EtageModal = ({ 
  isOpen, 
  onClose, 
  rackId, 
  rackName, 
  etagen, 
  onEtagenChange 
}: EtageModalProps) => {
  const [isAddingEtage, setIsAddingEtage] = useState(false);
  const [editingEtageId, setEditingEtageId] = useState<string | null>(null);
  const [addingFachToEtageId, setAddingFachToEtageId] = useState<string | null>(null);
  const [etageName, setEtageName] = useState("");
  const [etageNummer, setEtageNummer] = useState(1);
  const [fachBezeichnung, setFachBezeichnung] = useState("");
  const [fachBeschreibung, setFachBeschreibung] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { getAuthHeader } = useAuth();

  const resetForm = () => {
    setEtageName("");
    setEtageNummer(1);
    setFachBezeichnung("");
    setFachBeschreibung("");
    setIsAddingEtage(false);
    setEditingEtageId(null);
    setAddingFachToEtageId(null);
  };

  const handleAddEtage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!etageName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/etage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          regal_id: rackId,
          nummer: etageNummer,
          name: etageName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Fehler beim Erstellen der Etage");
      }

      toast({
        title: "Etage hinzugefügt",
        description: `Etage "${etageName}" wurde erfolgreich erstellt.`,
      });

      resetForm();
      onEtagenChange();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Etage konnte nicht erstellt werden",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEtage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEtageId || !etageName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/etage/${editingEtageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          nummer: etageNummer,
          name: etageName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Fehler beim Aktualisieren der Etage");
      }

      toast({
        title: "Etage aktualisiert",
        description: `Etage wurde erfolgreich aktualisiert.`,
      });

      resetForm();
      onEtagenChange();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Etage konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingFachToEtageId || !fachBezeichnung.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/etage/${addingFachToEtageId}/fach`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          bezeichnung: fachBezeichnung.trim(),
          beschreibung: fachBeschreibung.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Fehler beim Erstellen des Faches");
      }

      toast({
        title: "Fach hinzugefügt",
        description: `Fach "${fachBezeichnung}" wurde erfolgreich erstellt.`,
      });

      resetForm();
      onEtagenChange();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Fach konnte nicht erstellt werden",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEtage = async (etageId: string, etageName: string) => {
    if (!confirm(`Möchten Sie die Etage "${etageName}" wirklich löschen? Alle Fächer werden ebenfalls gelöscht.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/etage/${etageId}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error("Fehler beim Löschen der Etage");
      }

      toast({
        title: "Etage gelöscht",
        description: `Etage "${etageName}" wurde erfolgreich gelöscht.`,
      });

      onEtagenChange();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Etage konnte nicht gelöscht werden",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (etage: Etage) => {
    setEditingEtageId(etage.id);
    setEtageName(etage.name || "");
    setEtageNummer(etage.nummer);
    setIsAddingEtage(false);
    setAddingFachToEtageId(null);
  };

  const startAddFach = (etageId: string) => {
    setAddingFachToEtageId(etageId);
    setFachBezeichnung("");
    setFachBeschreibung("");
    setIsAddingEtage(false);
    setEditingEtageId(null);
  };

  const getNextEtageNummer = () => {
    const maxNummer = Math.max(...etagen.map(e => e.nummer), 0);
    return maxNummer + 1;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-card rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-glow p-6 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Etagen verwalten</h2>
                <p className="text-primary-foreground/80 mt-1">{rackName}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-primary-foreground hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            {/* Add/Edit Etage Form */}
            {(isAddingEtage || editingEtageId) && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>
                    {isAddingEtage ? "Neue Etage hinzufügen" : "Etage bearbeiten"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={isAddingEtage ? handleAddEtage : handleEditEtage} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="etage-nummer">Etagen-Nummer</Label>
                        <Input
                          id="etage-nummer"
                          type="number"
                          min="1"
                          max="99"
                          value={etageNummer}
                          onChange={(e) => setEtageNummer(parseInt(e.target.value) || 1)}
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <Label htmlFor="etage-name">Etagen-Name</Label>
                        <Input
                          id="etage-name"
                          value={etageName}
                          onChange={(e) => setEtageName(e.target.value)}
                          placeholder="z.B. Obergeschoss"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        disabled={isLoading}
                      >
                        Abbrechen
                      </Button>
                      <Button type="submit" disabled={isLoading || !etageName.trim()}>
                        {isLoading ? "Speichern..." : (isAddingEtage ? "Hinzufügen" : "Aktualisieren")}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Add Fach Form */}
            {addingFachToEtageId && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Neues Fach hinzufügen</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddFach} className="space-y-4">
                    <div>
                      <Label htmlFor="fach-bezeichnung">Fach-Bezeichnung *</Label>
                      <Input
                        id="fach-bezeichnung"
                        value={fachBezeichnung}
                        onChange={(e) => setFachBezeichnung(e.target.value)}
                        placeholder="z.B. F1, A1-F1"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="fach-beschreibung">Beschreibung</Label>
                      <Input
                        id="fach-beschreibung"
                        value={fachBeschreibung}
                        onChange={(e) => setFachBeschreibung(e.target.value)}
                        placeholder="Optionale Beschreibung..."
                        disabled={isLoading}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        disabled={isLoading}
                      >
                        Abbrechen
                      </Button>
                      <Button type="submit" disabled={isLoading || !fachBezeichnung.trim()}>
                        {isLoading ? "Speichern..." : "Hinzufügen"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Add Buttons */}
            {!isAddingEtage && !editingEtageId && !addingFachToEtageId && (
              <div className="mb-6">
                <Button
                  onClick={() => {
                    setIsAddingEtage(true);
                    setEtageNummer(getNextEtageNummer());
                    setEtageName("");
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Neue Etage hinzufügen
                </Button>
              </div>
            )}

            {/* Etagen List */}
            <div className="space-y-4">
              {etagen.map((etage) => (
                <Card key={etage.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-sm">
                          Etage {etage.nummer}
                        </Badge>
                        <h3 className="text-lg font-semibold">
                          {etage.name || `Etage ${etage.nummer}`}
                        </h3>
                        <Badge variant="outline">
                          {etage.faecher.length} Fächer
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startAddFach(etage.id)}
                          disabled={isLoading}
                          title="Fach hinzufügen"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(etage)}
                          disabled={isLoading}
                          title="Etage bearbeiten"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEtage(etage.id, etage.name || `Etage ${etage.nummer}`)}
                          disabled={isLoading}
                          className="text-destructive hover:text-destructive"
                          title="Etage löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {etage.faecher.map((fach) => (
                        <div
                          key={fach.id}
                          className="bg-muted/50 rounded-lg p-2 text-center text-sm"
                        >
                          {fach.bezeichnung}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {etagen.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Keine Etagen vorhanden</p>
                <p className="text-sm">Fügen Sie die erste Etage hinzu</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
