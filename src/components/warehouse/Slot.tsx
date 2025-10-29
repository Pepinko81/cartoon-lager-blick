import { motion } from "framer-motion";
import { Package } from "lucide-react";
import { Slot as SlotType } from "@/types/warehouse";

interface SlotProps {
  slot: SlotType;
  onClick: () => void;
}

export const Slot = ({ slot, onClick }: SlotProps) => {
  const hasContent = slot.images.length > 0 || slot.description;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      className="relative group"
    >
      <div
        className={`
          w-full h-24 rounded-lg border-2 
          transition-all duration-300 ease-out
          ${
            hasContent
              ? "bg-gradient-to-br from-accent/20 to-accent/10 border-accent/40 hover:border-accent"
              : "bg-gradient-to-br from-muted to-muted/50 border-border hover:border-primary"
          }
          shadow-md hover:shadow-xl
          backdrop-blur-sm
        `}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
          <Package
            className={`w-6 h-6 mb-1 transition-colors ${
              hasContent ? "text-accent" : "text-muted-foreground group-hover:text-primary"
            }`}
          />
          <span className="text-xs font-semibold text-foreground">{slot.name}</span>
        </div>

        {/* Glow effect on hover */}
        <div
          className={`
            absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300
            ${hasContent ? "bg-accent/10" : "bg-primary/10"}
          `}
        />
      </div>
    </motion.button>
  );
};
