import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Trash2, Save } from "lucide-react";
import { Slot } from "@/types/warehouse";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface SlotModalProps {
  slot: Slot | null;
  onClose: () => void;
  onUpdate: (slotId: string, description: string) => void;
  onImageUpload: (slotId: string, file: File) => void;
  onImageDelete: (slotId: string, imageUrl: string) => void;
}

export const SlotModal = ({
  slot,
  onClose,
  onUpdate,
  onImageUpload,
  onImageDelete,
}: SlotModalProps) => {
  const [description, setDescription] = useState(slot?.description || "");

  if (!slot) return null;

  const handleSave = () => {
    onUpdate(slot.id, description);
    toast({
      title: "Gespeichert",
      description: "Beschreibung wurde erfolgreich aktualisiert",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(slot.id, file);
      toast({
        title: "Hochgeladen",
        description: "Bild wird hochgeladen...",
      });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-glow p-6 text-primary-foreground">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{slot.name}</h2>
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
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Images Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-foreground">Bilder</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {slot.images.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group"
                  >
                    <img
                      src={image}
                      alt={`${slot.name} - ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onImageDelete(slot.id, image)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>

              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button variant="outline" className="w-full cursor-pointer" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Bild hochladen
                  </span>
                </Button>
              </label>
            </div>

            {/* Description Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">
                Beschreibung
              </h3>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschreibung oder Notizen hinzufügen..."
                className="min-h-[120px] resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-muted border-t border-border flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Speichern
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
