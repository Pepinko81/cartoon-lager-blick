import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Warehouse as WarehouseIcon, LogOut } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Rack as RackType, Slot as SlotType, AddRackData } from "@/types/warehouse";
import { Rack } from "./Rack";
import { SlotModal } from "./SlotModal";
import { AddRackModal } from "./AddRackModal";
import { EditRackModal } from "./EditRackModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { API_BASE } from "@/config/api";

export const WarehouseView = () => {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isAddRackModalOpen, setIsAddRackModalOpen] = useState(false);
  const [editingRackId, setEditingRackId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { getAuthHeader, benutzer, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch racks
  const { data: racks = [], isLoading, refetch } = useQuery<RackType[]>({
    queryKey: ["racks"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/regale`, {
        headers: {
          ...getAuthHeader(),
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate("/login");
        }
        throw new Error("Fehler beim Laden der Regale");
      }
      return response.json();
    },
  });

  // Add rack mutation
  const addRackMutation = useMutation({
    mutationFn: async (data: AddRackData) => {
      const response = await fetch(`${API_BASE}/regal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate("/login");
        }
        throw new Error("Fehler beim Hinzufügen des Regals");
      }
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

  // Update rack mutation
  const updateRackMutation = useMutation({
    mutationFn: async ({
      rackId,
      name,
      description,
    }: {
      rackId: string;
      name: string;
      description?: string;
    }) => {
      const response = await fetch(`${API_BASE}/regal/${rackId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ name, description }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate("/login");
        }
        throw new Error("Fehler beim Aktualisieren des Regals");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["racks"] });
      toast({
        title: "Erfolgreich",
        description: "Regal wurde aktualisiert",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Regal konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });

  // Delete rack mutation
  const deleteRackMutation = useMutation({
    mutationFn: async (rackId: string) => {
      const response = await fetch(`${API_BASE}/regal/${rackId}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeader(),
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate("/login");
        }
        throw new Error("Fehler beim Löschen des Regals");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["racks"] });
      toast({
        title: "Erfolgreich",
        description: "Regal wurde gelöscht",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Regal konnte nicht gelöscht werden",
        variant: "destructive",
      });
    },
  });

  // Update slot mutation
  const updateSlotMutation = useMutation({
    mutationFn: async ({
      slotId,
      name,
      description,
    }: {
      slotId: string;
      name?: string;
      description?: string;
    }) => {
      const response = await fetch(`${API_BASE}/fach/${slotId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ name, bezeichnung: name, description, beschreibung: description }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate("/login");
        }
        throw new Error("Fehler beim Aktualisieren des Fachs");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["racks"] });
    },
  });

  // Delete slot mutation
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const response = await fetch(`${API_BASE}/fach/${slotId}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeader(),
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate("/login");
        }
        throw new Error("Fehler beim Löschen des Fachs");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["racks"] });
      setSelectedSlotId(null);
      toast({
        title: "Erfolgreich",
        description: "Fach wurde gelöscht",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Fach konnte nicht gelöscht werden",
        variant: "destructive",
      });
    },
  });

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async ({ slotId, file }: { slotId: string; file: File }) => {
      const formData = new FormData();
      formData.append("bild", file);
      const authHeader = getAuthHeader();
      const headers: HeadersInit = {};
      
      // Add Authorization header if available
      if (authHeader && typeof authHeader === 'object' && 'Authorization' in authHeader) {
        headers['Authorization'] = authHeader['Authorization'] as string;
      }
      
      // Note: Don't set Content-Type for FormData - browser will set it automatically with boundary
      const response = await fetch(`${API_BASE}/fach/${slotId}/bild`, {
        method: "POST",
        headers: headers,
        body: formData,
      });
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate("/login");
        }
        const errorText = await response.text();
        console.error("Upload error:", errorText);
        throw new Error(`Fehler beim Hochladen des Bildes: ${response.status}`);
      }
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
    .flatMap((rack) => rack.etagen)
    .flatMap((etage) => etage.faecher)
    .find((fach) => fach.id === selectedSlotId);

  const handleSlotUpdate = (slotId: string, name?: string, description?: string) => {
    updateSlotMutation.mutate({ slotId, name, description });
  };

  const handleRackEdit = (rackId: string) => {
    setEditingRackId(rackId);
  };

  const handleRackUpdate = (rackId: string, data: { name: string; description?: string }) => {
    updateRackMutation.mutate({ rackId, ...data });
    setEditingRackId(null);
  };

  const handleRackDelete = (rackId: string) => {
    deleteRackMutation.mutate(rackId);
    setEditingRackId(null);
  };

  const handleSlotDelete = (slotId: string) => {
    deleteSlotMutation.mutate(slotId);
  };

  const handleImageUpload = (slotId: string, file: File) => {
    uploadImageMutation.mutate({ slotId, file });
  };

  const handleImageDelete = async (slotId: string, imageUrl: string) => {
    try {
      // Finde die Bild-ID aus den geladenen Daten
      const slot = racks
        .flatMap((rack) => rack.etagen)
        .flatMap((etage) => etage.faecher)
        .find((fach) => fach.id === slotId);

      if (!slot) {
        toast({
          title: "Fehler",
          description: "Fach nicht gefunden",
          variant: "destructive",
        });
        return;
      }

      // Prüfe ob images ein Array von Objekten mit id ist
      let bildId: string | null = null;
      
      if (slot.images.length > 0 && typeof slot.images[0] === "object" && "id" in slot.images[0]) {
        // Images sind Objekte mit id und url
        const imageObj = (slot.images as Array<{ id: string; url: string }>).find(
          (img) => img.url === imageUrl
        );
        bildId = imageObj?.id || null;
      } else {
        // Fallback: Images sind Strings, suche nach Dateinamen
        const fileName = imageUrl.split("/").pop();
        // Finde Bild-ID über Backend-Endpunkt nach Dateinamen
        const response = await fetch(`${API_BASE}/regale`, {
          headers: getAuthHeader(),
        });
        if (!response.ok) throw new Error("Fehler beim Laden der Regale");
        const allRacks = await response.json();
        
        for (const rack of allRacks) {
          for (const etage of rack.etagen) {
            for (const fach of etage.faecher) {
              if (fach.id === slotId && Array.isArray(fach.bilder)) {
                for (const img of fach.bilder) {
                  if (typeof img === "object" && "url" in img && img.url === imageUrl) {
                    bildId = img.id;
                    break;
                  }
                }
              }
            }
          }
        }
      }

      if (!bildId) {
        toast({
          title: "Fehler",
          description: "Bild-ID nicht gefunden",
          variant: "destructive",
        });
        return;
      }

      // Lösche das Bild
      const deleteResponse = await fetch(`${API_BASE}/bild/${bildId}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });

      if (!deleteResponse.ok) {
        if (deleteResponse.status === 401) {
          logout();
          navigate("/login");
        }
        throw new Error("Fehler beim Löschen des Bildes");
      }

      queryClient.invalidateQueries({ queryKey: ["racks"] });
      toast({
        title: "Erfolgreich",
        description: "Bild wurde gelöscht",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Bild konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
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
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex-shrink-0"
              >
                <WarehouseIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </motion.div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground truncate">
                Lagerverwaltung
              </h1>
            </div>
            
            {/* Mobile Layout */}
            <div className="flex sm:hidden items-center gap-1">
              <Button
                onClick={() => setIsAddRackModalOpen(true)}
                size="sm"
                className="h-8 px-2 text-xs"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span className="hidden xs:inline">Neues</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {benutzer?.email.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs">
                    {benutzer?.email || "Benutzer"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="text-xs"
                  >
                    <LogOut className="w-3 h-3 mr-2" />
                    Abmelden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center gap-3">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar>
                      <AvatarFallback>
                        {benutzer?.email.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {benutzer?.email || "Benutzer"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Abmelden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setIsAddRackModalOpen(true)} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Neues Regal
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            {racks.map((rack) => (
              <Rack
                key={rack.id}
                rack={rack}
                onSlotClick={(slotId) => setSelectedSlotId(slotId)}
                onEdit={handleRackEdit}
                onEtagenChange={() => refetch()}
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
        onDelete={handleSlotDelete}
      />

      <AddRackModal
        isOpen={isAddRackModalOpen}
        onClose={() => setIsAddRackModalOpen(false)}
        onAdd={(data) => addRackMutation.mutate(data)}
      />

      <EditRackModal
        rack={racks.find((r) => r.id === editingRackId) || null}
        isOpen={!!editingRackId}
        onClose={() => setEditingRackId(null)}
        onUpdate={handleRackUpdate}
        onDelete={handleRackDelete}
      />
    </div>
  );
};
