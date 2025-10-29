import { motion } from "framer-motion";
import { Edit, MoreVertical, Layers, Settings } from "lucide-react";
import { Rack as RackType, Etage, Fach } from "@/types/warehouse";
import { Slot } from "./Slot";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EtageModal } from "./EtageModal";
import { useState } from "react";

interface RackProps {
  rack: RackType;
  onSlotClick: (slotId: string) => void;
  onEdit: (rackId: string) => void;
  onEtagenChange?: () => void;
}

export const Rack = ({ rack, onSlotClick, onEdit, onEtagenChange }: RackProps) => {
  const [isEtageModalOpen, setIsEtageModalOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="bg-card rounded-xl shadow-2xl overflow-hidden border border-border">
        {/* Rack Header */}
        <div className="bg-gradient-to-r from-secondary to-secondary/80 p-4 text-secondary-foreground relative group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold">{rack.name}</h3>
              {rack.description && (
                <p className="text-sm opacity-90 mt-1">{rack.description}</p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-secondary-foreground hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(rack.id)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Regal bearbeiten
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsEtageModalOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Etagen verwalten
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Rack Body - Etagen */}
        <div className="p-6 bg-gradient-to-br from-background to-muted/20">
          <div className="space-y-6">
            {rack.etagen.map((etage, etageIndex) => (
              <motion.div
                key={etage.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: etageIndex * 0.1, duration: 0.3 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Layers className="w-5 h-5" />
                      {etage.name || `Etage ${etage.nummer}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {etage.faecher.map((fach, fachIndex) => {
                        // Convert Fach to Slot format for compatibility
                        const slot = {
                          id: fach.id,
                          name: fach.bezeichnung,
                          description: fach.beschreibung,
                          images: fach.bilder,
                          rackId: rack.id,
                        };
                        return (
                          <motion.div
                            key={fach.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: fachIndex * 0.05, duration: 0.3 }}
                          >
                            <Slot slot={slot} onClick={() => onSlotClick(fach.id)} />
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Etage Management Modal */}
      <EtageModal
        isOpen={isEtageModalOpen}
        onClose={() => setIsEtageModalOpen(false)}
        rackId={rack.id}
        rackName={rack.name}
        etagen={rack.etagen}
        onEtagenChange={onEtagenChange || (() => {})}
      />
    </motion.div>
  );
};
