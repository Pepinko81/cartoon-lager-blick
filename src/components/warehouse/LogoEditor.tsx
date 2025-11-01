import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, X, Image as ImageIcon } from "lucide-react";
import { LogoConfig } from "@/types/warehouse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { toast } from "@/hooks/use-toast";
import {
  uploadLogo,
  getLogoConfig,
  updateLogoPosition,
  deleteLogo,
} from "@/api/warehouse";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface LogoEditorProps {
  onClose: () => void;
  onPositionUpdate?: (position: { position_x: number; position_y: number; position_z: number; scale: number }) => void;
}

export const LogoEditor = ({ onClose, onPositionUpdate }: LogoEditorProps) => {
  const [position, setPosition] = useState({
    position_x: 0,
    position_y: 5,
    position_z: -5.8,
    scale: 3,
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch current logo config
  const { data: currentLogo } = useQuery<LogoConfig | null>({
    queryKey: ["logoConfig"],
    queryFn: getLogoConfig,
    retry: false,
  });

  useEffect(() => {
    if (currentLogo) {
      setPosition({
        position_x: currentLogo.position_x,
        position_y: currentLogo.position_y,
        position_z: currentLogo.position_z,
        scale: currentLogo.scale,
      });
      setLogoPreview(currentLogo.logo_url);
    }
  }, [currentLogo]);

  // Upload logo mutation
  const uploadMutation = useMutation({
    mutationFn: uploadLogo,
    onSuccess: (data) => {
      setLogoPreview(data.logo_url);
      setPosition({
        position_x: data.position_x,
        position_y: data.position_y,
        position_z: data.position_z,
        scale: data.scale,
      });
      queryClient.invalidateQueries({ queryKey: ["logoConfig"] });
      toast({
        title: "Erfolgreich",
        description: "Logo wurde hochgeladen",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Hochladen des Logos",
        variant: "destructive",
      });
    },
  });

  // Update position mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, pos }: { id: string; pos: typeof position }) =>
      updateLogoPosition(id, pos),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["logoConfig"] });
      if (onPositionUpdate) {
        onPositionUpdate({
          position_x: data.position_x,
          position_y: data.position_y,
          position_z: data.position_z,
          scale: data.scale,
        });
      }
      toast({
        title: "Erfolgreich",
        description: "Logo-Position wurde aktualisiert",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Aktualisieren der Logo-Position",
        variant: "destructive",
      });
    },
  });

  // Delete logo mutation
  const deleteMutation = useMutation({
    mutationFn: deleteLogo,
    onSuccess: () => {
      setLogoPreview(null);
      queryClient.invalidateQueries({ queryKey: ["logoConfig"] });
      toast({
        title: "Erfolgreich",
        description: "Logo wurde gelöscht",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Löschen des Logos",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (file: File) => {
    uploadMutation.mutate(file);
  };

  const handleSave = () => {
    if (!currentLogo) {
      toast({
        title: "Fehler",
        description: "Bitte laden Sie zuerst ein Logo hoch",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({ id: currentLogo.id, pos: position });
  };

  const handleDelete = () => {
    if (!currentLogo) return;
    if (confirm("Möchten Sie das Logo wirklich löschen?")) {
      deleteMutation.mutate(currentLogo.id);
    }
  };

  const handlePositionChange = (field: keyof typeof position, value: number) => {
    setPosition((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-card rounded-lg shadow-xl border border-border p-6 max-w-2xl w-full"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Logo bearbeiten</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Logo Upload Section */}
        <div>
          <Label className="mb-2 block">Logo hochladen</Label>
          {!logoPreview && (
            <FileUpload
              onFileSelect={handleFileUpload}
              accept="image/*"
              maxSize={5 * 1024 * 1024}
              disabled={uploadMutation.isPending}
              label="Logo-Datei hochladen oder hierher ziehen"
            />
          )}
          {logoPreview && (
            <div className="relative">
              <img
                src={logoPreview}
                alt="Logo Preview"
                className="w-full max-h-48 object-contain rounded-lg border border-border bg-muted p-4"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          {uploadMutation.isPending && (
            <p className="mt-2 text-sm text-muted-foreground">Wird hochgeladen...</p>
          )}
        </div>

        {/* Position Controls */}
        {logoPreview && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position_x">Position X</Label>
              <Input
                id="position_x"
                type="number"
                step="0.1"
                value={position.position_x}
                onChange={(e) =>
                  handlePositionChange("position_x", parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div>
              <Label htmlFor="position_y">Position Y</Label>
              <Input
                id="position_y"
                type="number"
                step="0.1"
                value={position.position_y}
                onChange={(e) =>
                  handlePositionChange("position_y", parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div>
              <Label htmlFor="position_z">Position Z</Label>
              <Input
                id="position_z"
                type="number"
                step="0.1"
                value={position.position_z}
                onChange={(e) =>
                  handlePositionChange("position_z", parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div>
              <Label htmlFor="scale">Skalierung</Label>
              <Input
                id="scale"
                type="number"
                step="0.1"
                min="0.5"
                max="10"
                value={position.scale}
                onChange={(e) =>
                  handlePositionChange("scale", parseFloat(e.target.value) || 1)
                }
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          {logoPreview && (
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Position speichern
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

