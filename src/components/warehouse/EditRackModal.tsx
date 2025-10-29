import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Rack } from "@/types/warehouse";
import { toast } from "@/hooks/use-toast";

interface EditRackModalProps {
  rack: Rack | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (rackId: string, data: { name: string; description?: string }) => void;
  onDelete: (rackId: string) => void;
}

export const EditRackModal = ({
  rack,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: EditRackModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (rack) {
      setName(rack.name);
      setDescription(rack.description || "");
    }
  }, [rack]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!rack || !name.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Namen ein",
        variant: "destructive",
      });
      return;
    }

    onUpdate(rack.id, { name: name.trim(), description: description.trim() || undefined });
    onClose();
  };

  const handleDelete = () => {
    if (!rack) return;

    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    onDelete(rack.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  if (!isOpen || !rack) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-card rounded-2xl shadow-2xl max-w-md w-full"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-glow p-6 text-primary-foreground">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Regal bearbeiten</h2>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <Label htmlFor="edit-rack-name">Name des Regals *</Label>
              <Input
                id="edit-rack-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Regal A"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-rack-description">Beschreibung</Label>
              <Textarea
                id="edit-rack-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optionale Beschreibung..."
                className="resize-none"
              />
            </div>

            {showDeleteConfirm && (
              <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm text-destructive-foreground mb-3">
                  Sind Sie sicher, dass Sie dieses Regal löschen möchten? Alle Fächer und Bilder werden ebenfalls gelöscht.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                  >
                    Endgültig löschen
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={showDeleteConfirm}
              >
                Löschen
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Abbrechen
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Speichern
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

