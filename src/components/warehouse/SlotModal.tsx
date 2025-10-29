import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Trash2, Save } from "lucide-react";
import { Slot } from "@/types/warehouse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface SlotModalProps {
  slot: Slot | null;
  onClose: () => void;
  onUpdate: (slotId: string, name?: string, description?: string) => void;
  onImageUpload: (slotId: string, file: File) => void;
  onImageDelete: (slotId: string, imageUrl: string) => void;
  onDelete: (slotId: string) => void;
}

export const SlotModal = ({
  slot,
  onClose,
  onUpdate,
  onImageUpload,
  onImageDelete,
  onDelete,
}: SlotModalProps) => {
  const [name, setName] = useState(slot?.name || "");
  const [description, setDescription] = useState(slot?.description || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (slot) {
      setName(slot.name);
      setDescription(slot.description || "");
    }
  }, [slot]);

  if (!slot) return null;

  const handleSave = () => {
    const nameChanged = name !== slot.name;
    const descriptionChanged = description !== (slot.description || "");
    
    if (nameChanged || descriptionChanged) {
      onUpdate(slot.id, nameChanged ? name : undefined, descriptionChanged ? description : undefined);
      toast({
        title: "Gespeichert",
        description: "Fach wurde erfolgreich aktualisiert",
      });
    }
  };

  const handleDelete = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    onDelete(slot.id);
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-glow p-4 sm:p-6 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold truncate">{slot.name}</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-primary-foreground hover:bg-white/20 flex-shrink-0 ml-2"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-140px)]">
            {/* Name Section */}
            <div className="mb-6">
              <Label htmlFor="slot-name">Fachname</Label>
              <Input
                id="slot-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Fachname"
                className="mt-1"
              />
            </div>

            {/* Images Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-foreground">Bilder</h3>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                {(slot.images || []).map((image, index) => {
                  const imageUrl = typeof image === "string" ? image : image.url;
                  return (
                    <motion.div
                      key={typeof image === "string" ? index : image.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group"
                    >
                      <img
                        src={imageUrl}
                        alt={`${slot.name} - ${index + 1}`}
                        className="w-full h-32 object-contain rounded-lg border-2 border-border bg-muted"
                        onError={(e) => {
                          console.error('Image failed to load:', imageUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onImageDelete(slot.id, imageUrl)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>

              <label className="block">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Bild hochladen
                </div>
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
          <div className="p-4 sm:p-6 bg-muted border-t border-border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                {showDeleteConfirm ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <p className="text-sm text-destructive-foreground">
                      Sicher löschen?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                      >
                        Endgültig löschen
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Löschen
                  </Button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                  Abbrechen
                </Button>
                <Button onClick={handleSave} className="w-full sm:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  Speichern
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
