import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddRackData } from "@/types/warehouse";
import { toast } from "@/hooks/use-toast";

interface AddRackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: AddRackData) => void;
}

export const AddRackModal = ({ isOpen, onClose, onAdd }: AddRackModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slotCount, setSlotCount] = useState(12);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Namen ein",
        variant: "destructive",
      });
      return;
    }

    onAdd({ name, description, slotCount });
    setName("");
    setDescription("");
    setSlotCount(12);
    onClose();
  };

  if (!isOpen) return null;

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
              <h2 className="text-2xl font-bold">Neues Regal</h2>
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
              <Label htmlFor="rack-name">Name des Regals *</Label>
              <Input
                id="rack-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Regal A"
                required
              />
            </div>

            <div>
              <Label htmlFor="rack-description">Beschreibung</Label>
              <Textarea
                id="rack-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optionale Beschreibung..."
                className="resize-none"
              />
            </div>

            <div>
              <Label htmlFor="slot-count">Anzahl der Fächer</Label>
              <Input
                id="slot-count"
                type="number"
                min="1"
                max="100"
                value={slotCount}
                onChange={(e) => setSlotCount(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Fächer werden automatisch nummeriert (F1, F2, ...)
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button type="submit">
                <Plus className="w-4 h-4 mr-2" />
                Regal hinzufügen
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
