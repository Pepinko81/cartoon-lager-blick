import { motion } from "framer-motion";
import { Rack as RackType } from "@/types/warehouse";
import { Slot } from "./Slot";

interface RackProps {
  rack: RackType;
  onSlotClick: (slotId: string) => void;
}

export const Rack = ({ rack, onSlotClick }: RackProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="bg-card rounded-xl shadow-2xl overflow-hidden border border-border">
        {/* Rack Header */}
        <div className="bg-gradient-to-r from-secondary to-secondary/80 p-4 text-secondary-foreground">
          <h3 className="text-xl font-bold">{rack.name}</h3>
          {rack.description && (
            <p className="text-sm opacity-90 mt-1">{rack.description}</p>
          )}
        </div>

        {/* Rack Body - Slots Grid */}
        <div className="p-6 bg-gradient-to-br from-background to-muted/20">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {rack.slots.map((slot, index) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <Slot slot={slot} onClick={() => onSlotClick(slot.id)} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
