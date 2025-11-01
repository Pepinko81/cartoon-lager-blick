import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ZoomIn, ZoomOut, Grid, RotateCcw, Plus } from "lucide-react";
import { Rack } from "@/types/warehouse";
import { FloorPlan } from "@/types/warehouse";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { toast } from "@/hooks/use-toast";
import { getFloorPlan, uploadFloorPlan } from "@/api/warehouse";
import { updateRackPosition } from "@/api/warehouse";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

interface WarehouseMapProps {
  racks: Rack[];
  onRackClick?: (rackId: string) => void;
}

export const WarehouseMap = ({ racks, onRackClick }: WarehouseMapProps) => {
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [rackPositions, setRackPositions] = useState<Record<string, { x: number; y: number }>>({});
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Initialize rack positions from racks data
  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    racks.forEach((rack) => {
      positions[rack.id] = {
        x: rack.position_x ?? 100,
        y: rack.position_y ?? 100,
      };
    });
    setRackPositions(positions);
  }, [racks]);

  // Fetch floor plan on mount
  useEffect(() => {
    getFloorPlan()
      .then((plan) => {
        if (plan) {
          setFloorPlan(plan);
        }
      })
      .catch((error) => {
        console.error("Fehler beim Laden des Grundrisses:", error);
      });
  }, []);

  // Upload floor plan mutation
  const uploadMutation = useMutation({
    mutationFn: uploadFloorPlan,
    onSuccess: (data) => {
      setFloorPlan(data);
      setShowUpload(false);
      toast({
        title: "Erfolgreich",
        description: "Grundriss wurde hochgeladen",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Hochladen des Grundrisses",
        variant: "destructive",
      });
    },
  });

  // Update rack position mutation (debounced)
  const updatePositionMutation = useMutation({
    mutationFn: ({ rackId, x, y }: { rackId: string; x: number; y: number }) =>
      updateRackPosition(rackId, x, y),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["racks"] });
    },
    onError: (error: Error) => {
      console.error("Fehler beim Aktualisieren der Position:", error);
    },
  });

  const handleFileUpload = (file: File) => {
    uploadMutation.mutate(file);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.5));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse events for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !dragging) {
      // Left mouse button, not dragging a rack
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && !dragging) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && !dragging) {
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanning && !dragging && e.touches.length === 1) {
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - panStart.x,
        y: touch.clientY - panStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  // Rack drag handlers
  const handleRackMouseDown = (e: React.MouseEvent, rackId: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = mapContainerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const currentPos = rackPositions[rackId] || { x: 100, y: 100 };
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    setDragging(rackId);
    setDragOffset({
      x: mouseX - (currentPos.x * zoom + pan.x),
      y: mouseY - (currentPos.y * zoom + pan.y),
    });
  };

  const handleRackMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || !mapContainerRef.current) return;

      const containerRect = mapContainerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      
      const x = (mouseX - pan.x - dragOffset.x) / zoom;
      const y = (mouseY - pan.y - dragOffset.y) / zoom;

      // Update visual position in real-time
      setRackPositions((prev) => ({
        ...prev,
        [dragging]: { x, y },
      }));
    },
    [dragging, dragOffset, pan, zoom]
  );

  const handleRackMouseUp = useCallback(
    () => {
      if (!dragging) return;

      const currentPos = rackPositions[dragging];
      if (currentPos) {
        // Save position to backend
        updatePositionMutation.mutate({ 
          rackId: dragging, 
          x: currentPos.x, 
          y: currentPos.y 
        });
      }

      setDragging(null);
      setDragOffset({ x: 0, y: 0 });
    },
    [dragging, rackPositions, updatePositionMutation]
  );

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleRackMouseMove);
      window.addEventListener("mouseup", handleRackMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleRackMouseMove);
        window.removeEventListener("mouseup", handleRackMouseUp);
      };
    }
  }, [dragging, handleRackMouseMove, handleRackMouseUp]);

  return (
    <div className="w-full h-full relative">
      {/* Controls Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUpload(!showUpload)}
          className="bg-card/90 backdrop-blur-sm"
        >
          <Upload className="w-4 h-4 mr-2" />
          Grundriss hochladen
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          className="bg-card/90 backdrop-blur-sm"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          className="bg-card/90 backdrop-blur-sm"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetView}
          className="bg-card/90 backdrop-blur-sm"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant={showGrid ? "default" : "outline"}
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
          className="bg-card/90 backdrop-blur-sm"
        >
          <Grid className="w-4 h-4" />
        </Button>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-lg shadow-xl border border-border p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold mb-4">Grundriss hochladen</h3>
              <FileUpload
                onFileSelect={handleFileUpload}
                accept="image/*"
                maxSize={10 * 1024 * 1024}
                disabled={uploadMutation.isPending}
                label="Grundriss-Bild hochladen oder hierher ziehen"
              />
              {uploadMutation.isPending && (
                <p className="mt-2 text-sm text-muted-foreground">Wird hochgeladen...</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-[600px] bg-muted rounded-lg overflow-hidden relative border border-border"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isPanning ? "grabbing" : dragging ? "grabbing" : "grab" }}
      >
        {/* Floor Plan Background */}
        {floorPlan ? (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${floorPlan.image_path})`,
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Kein Grundriss vorhanden</p>
              <Button onClick={() => setShowUpload(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Grundriss hinzufügen
              </Button>
            </div>
          </div>
        )}

        {/* Grid Overlay */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              transform: `translate(${pan.x}px, ${pan.y}px)`,
            }}
          />
        )}

        {/* Racks */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          {racks.map((rack) => {
            const position = rackPositions[rack.id] || { x: rack.position_x ?? 100, y: rack.position_y ?? 100 };
            const isDraggingThis = dragging === rack.id;

            return (
              <motion.div
                key={rack.id}
                className={`absolute cursor-move select-none ${
                  isDraggingThis ? "z-50" : "z-10"
                }`}
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  transform: "translate(-50%, -50%)",
                }}
                onMouseDown={(e) => handleRackMouseDown(e, rack.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onRackClick && !isDraggingThis) {
                    onRackClick(rack.id);
                  }
                }}
                whileHover={!isDraggingThis ? { scale: 1.1 } : {}}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`bg-primary text-primary-foreground rounded-lg px-3 py-2 shadow-lg border-2 border-background min-w-[120px] text-center ${
                  isDraggingThis ? "opacity-80" : ""
                }`}>
                  <p className="font-semibold text-sm">{rack.name}</p>
                  <p className="text-xs opacity-80">{rack.etagen.length} Etagen</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Instructions */}
        {!floorPlan && (
          <div className="absolute bottom-4 left-4 right-4 text-center text-sm text-muted-foreground bg-card/80 backdrop-blur-sm rounded p-2">
            <p>Laden Sie einen Grundriss hoch und ziehen Sie die Regale an die gewünschten Positionen</p>
          </div>
        )}
      </div>
    </div>
  );
};

