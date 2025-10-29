import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Warehouse as WarehouseIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Rack as RackType, Slot as SlotType, AddRackData } from "@/types/warehouse";
import { Rack } from "./Rack";
import { SlotModal } from "./SlotModal";
import { AddRackModal } from "./AddRackModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "@/hooks/use-toast";

const API_BASE = "http://localhost:5000/api";

export const WarehouseView = () => {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isAddRackModalOpen, setIsAddRackModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch racks
  const { data: racks = [], isLoading } = useQuery<RackType[]>({
    queryKey: ["racks"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/regale`);
      if (!response.ok) throw new Error("Fehler beim Laden der Regale");
      return response.json();
    },
  });

  // Add rack mutation
  const addRackMutation = useMutation({
    mutationFn: async (data: AddRackData) => {
      const response = await fetch(`${API_BASE}/regal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Fehler beim Hinzufügen des Regals");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["racks"] });
      toast({
        title: "Erfolgreich",
        description: "Regal wurde hinzugefügt",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Regal konnte nicht hinzugefügt werden",
        variant: "destructive",
      });
    },
  });

  // Update slot mutation
  const updateSlotMutation = useMutation({
    mutationFn: async ({
      slotId,
      description,
    }: {
      slotId: string;
      description: string;
    }) => {
      const response = await fetch(`${API_BASE}/slot/${slotId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!response.ok) throw new Error("Fehler beim Aktualisieren des Fachs");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["racks"] });
    },
  });

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async ({ slotId, file }: { slotId: string; file: File }) => {
      const formData = new FormData();
      formData.append("bild", file);
      const response = await fetch(`${API_BASE}/slot/${slotId}/bild`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Fehler beim Hochladen des Bildes");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["racks"] });
      toast({
        title: "Erfolgreich",
        description: "Bild wurde hochgeladen",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Bild konnte nicht hochgeladen werden",
        variant: "destructive",
      });
    },
  });

  const selectedSlot = racks
    .flatMap((rack) => rack.slots)
    .find((slot) => slot.id === selectedSlotId);

  const handleSlotUpdate = (slotId: string, description: string) => {
    updateSlotMutation.mutate({ slotId, description });
  };

  const handleImageUpload = (slotId: string, file: File) => {
    uploadImageMutation.mutate({ slotId, file });
  };

  const handleImageDelete = async (slotId: string, imageUrl: string) => {
    // Implement delete logic
    toast({
      title: "Info",
      description: "Löschen von Bildern wird implementiert",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <WarehouseIcon className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40 backdrop-blur-lg bg-card/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <WarehouseIcon className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Lagerverwaltung
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button onClick={() => setIsAddRackModalOpen(true)} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Neues Regal
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {racks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <WarehouseIcon className="w-24 h-24 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Noch keine Regale vorhanden
            </h2>
            <p className="text-muted-foreground mb-6">
              Fügen Sie Ihr erstes Regal hinzu, um loszulegen
            </p>
            <Button onClick={() => setIsAddRackModalOpen(true)} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Erstes Regal hinzufügen
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {racks.map((rack) => (
              <Rack
                key={rack.id}
                rack={rack}
                onSlotClick={(slotId) => setSelectedSlotId(slotId)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <SlotModal
        slot={selectedSlot || null}
        onClose={() => setSelectedSlotId(null)}
        onUpdate={handleSlotUpdate}
        onImageUpload={handleImageUpload}
        onImageDelete={handleImageDelete}
      />

      <AddRackModal
        isOpen={isAddRackModalOpen}
        onClose={() => setIsAddRackModalOpen(false)}
        onAdd={(data) => addRackMutation.mutate(data)}
      />
    </div>
  );
};
