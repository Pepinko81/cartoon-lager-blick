import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ZoomIn, ZoomOut, Grid, RotateCcw, Plus, Pencil, Save, Trash2, X } from "lucide-react";
import { Rack } from "@/types/warehouse";
import { FloorPlan } from "@/types/warehouse";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { toast } from "@/hooks/use-toast";
import { getFloorPlan, uploadFloorPlan, deleteFloorPlan } from "@/api/warehouse";
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
  const [rackRotations, setRackRotations] = useState<Record<string, number>>({});
  const [showDrawing, setShowDrawing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState<"pencil" | "rectangle" | "line" | "erase">("pencil");
  const [drawingColor, setDrawingColor] = useState("#000000");
  const [drawingLineWidth, setDrawingLineWidth] = useState(2);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasContext, setCanvasContext] = useState<CanvasRenderingContext2D | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Initialize rack positions and rotations from racks data
  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const rotations: Record<string, number> = {};
    racks.forEach((rack) => {
      positions[rack.id] = {
        x: rack.position_x ?? 100,
        y: rack.position_y ?? 100,
      };
      rotations[rack.id] = rack.rotation ?? 0;
    });
    setRackPositions(positions);
    setRackRotations(rotations);
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
      // Invalidate floor plan query
      queryClient.invalidateQueries({ queryKey: ["floorPlan"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Hochladen des Grundrisses",
        variant: "destructive",
      });
    },
  });

  // Delete floor plan mutation
  const deleteFloorPlanMutation = useMutation({
    mutationFn: deleteFloorPlan,
    onSuccess: () => {
      setFloorPlan(null);
      toast({
        title: "Erfolgreich",
        description: "Grundriss wurde gelöscht",
      });
      queryClient.invalidateQueries({ queryKey: ["floorPlan"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Löschen des Grundrisses",
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

  // Rack drag handlers - fixed for zoom
  const handleRackMouseDown = (e: React.MouseEvent, rackId: string) => {
    e.stopPropagation();
    const containerRect = mapContainerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const currentPos = rackPositions[rackId] || { x: 100, y: 100 };
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    // Calculate offset considering zoom and pan
    // Position in transformed space: (currentPos.x * zoom) + pan.x
    setDragging(rackId);
    setDragOffset({
      x: mouseX - ((currentPos.x * zoom) + pan.x),
      y: mouseY - ((currentPos.y * zoom) + pan.y),
    });
  };

  const handleRackMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || !mapContainerRef.current) return;

      const containerRect = mapContainerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      
      // Convert screen coordinates to map coordinates accounting for zoom and pan
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

  // Update rotation mutation - defined first
  const updateRotationMutation = useMutation({
    mutationFn: ({ rackId, rotation }: { rackId: string; rotation: number }) => {
      const position = rackPositions[rackId] || { x: 100, y: 100 };
      return updateRackPosition(rackId, position.x, position.y, rotation);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["racks"] });
    },
    onError: (error: Error) => {
      console.error("Fehler beim Aktualisieren der Rotation:", error);
    },
  });

  // Handle rack rotation - rotate by 45 degrees each time
  const handleRackRotate = useCallback((rackId: string) => {
    console.log("🔄 handleRackRotate called for:", rackId);
    setRackRotations((prev) => {
      const currentRotation = prev[rackId] ?? racks.find(r => r.id === rackId)?.rotation ?? 0;
      const newRotation = (currentRotation + 45) % 360;
      const updated = { ...prev, [rackId]: newRotation };
      
      console.log("🔄 New rotation:", newRotation, "for rack:", rackId);
      
      // Save rotation to backend
      updateRotationMutation.mutate({ rackId, rotation: newRotation });
      
      return updated;
    });
  }, [updateRotationMutation, racks]);

  // Drawing handlers
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  
  const handleDrawingStart = useCallback((e: React.MouseEvent) => {
    if (!mapContainerRef.current || !showDrawing) return;
    
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDrawingStart({ x, y });
    setIsDrawing(true);
    setIsPanning(false);
    
    // Initialize canvas if not exists
    if (!canvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.zIndex = "5";
      canvas.style.pointerEvents = showDrawing ? "auto" : "none";
      mapContainerRef.current.appendChild(canvas);
      canvasRef.current = canvas;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        setCanvasContext(ctx);
        ctx.strokeStyle = drawingColor;
        ctx.lineWidth = drawingLineWidth;
        ctx.lineCap = "round";
        if (drawingMode === "pencil" || drawingMode === "erase") {
          ctx.beginPath();
          ctx.moveTo(x, y);
        }
      }
    } else if (canvasContext) {
      // Canvas already exists, update context settings
      canvasContext.strokeStyle = drawingColor;
      canvasContext.lineWidth = drawingLineWidth;
      canvasContext.lineCap = "round";
      if (drawingMode === "pencil" || drawingMode === "erase") {
        canvasContext.beginPath();
        canvasContext.moveTo(x, y);
      }
    }
  }, [showDrawing, drawingColor, drawingLineWidth, drawingMode, canvasContext]);

  const handleDrawingMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !canvasContext || !mapContainerRef.current) return;
    
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (drawingMode === "pencil") {
      canvasContext.strokeStyle = drawingColor;
      canvasContext.lineTo(x, y);
      canvasContext.stroke();
    } else if (drawingMode === "erase") {
      canvasContext.strokeStyle = "#ffffff";
      canvasContext.globalCompositeOperation = "destination-out";
      canvasContext.lineTo(x, y);
      canvasContext.stroke();
      canvasContext.globalCompositeOperation = "source-over";
    }
  }, [isDrawing, canvasContext, drawingMode, drawingColor]);

  const handleDrawingEnd = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !canvasContext || !drawingStart || !mapContainerRef.current) return;
    
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (drawingMode === "rectangle") {
      canvasContext.strokeStyle = drawingColor;
      canvasContext.strokeRect(
        drawingStart.x,
        drawingStart.y,
        x - drawingStart.x,
        y - drawingStart.y
      );
    } else if (drawingMode === "line") {
      canvasContext.strokeStyle = drawingColor;
      canvasContext.beginPath();
      canvasContext.moveTo(drawingStart.x, drawingStart.y);
      canvasContext.lineTo(x, y);
      canvasContext.stroke();
    }
    
    setIsDrawing(false);
    setDrawingStart(null);
  }, [isDrawing, canvasContext, drawingStart, drawingMode, drawingColor]);

  // Export drawn map as image and upload
  const handleSaveDrawing = useCallback(async () => {
    if (!canvasRef.current) return;
    
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      
      const file = new File([blob], `drawn-map-${Date.now()}.png`, { type: "image/png" });
      try {
        await uploadMutation.mutateAsync(file);
        setShowDrawing(false);
        if (canvasRef.current) {
          canvasRef.current.remove();
          canvasRef.current = null;
          setCanvasContext(null);
        }
        toast({
          title: "Erfolgreich",
          description: "Gezeichnete Karte wurde gespeichert",
        });
      } catch (error) {
        toast({
          title: "Fehler",
          description: "Fehler beim Speichern der gezeichneten Karte",
          variant: "destructive",
        });
      }
    }, "image/png");
  }, [uploadMutation]);

  // Clear drawing
  const handleClearDrawing = useCallback(() => {
    if (canvasContext && canvasRef.current) {
      canvasContext.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [canvasContext]);

  // Cleanup canvas when drawing mode is disabled
  useEffect(() => {
    if (!showDrawing && canvasRef.current) {
      canvasRef.current.remove();
      canvasRef.current = null;
      setCanvasContext(null);
    }
  }, [showDrawing]);

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
        {floorPlan ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Möchten Sie den Grundriss wirklich löschen?")) {
                deleteFloorPlanMutation.mutate(floorPlan.id);
              }
            }}
            className="bg-card/90 backdrop-blur-sm"
            disabled={deleteFloorPlanMutation.isPending}
          >
            <X className="w-4 h-4 mr-2" />
            {deleteFloorPlanMutation.isPending ? "Löschen..." : "Grundriss löschen"}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUpload(!showUpload)}
            className="bg-card/90 backdrop-blur-sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            Grundriss hochladen
          </Button>
        )}
        <Button
          variant={showDrawing ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setShowDrawing(!showDrawing);
            if (!showDrawing) {
              setIsDrawing(false);
            }
          }}
          className="bg-card/90 backdrop-blur-sm"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Karte zeichnen
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
        onMouseDown={(e) => {
          if (showDrawing && !isPanning && !dragging) {
            e.preventDefault();
            e.stopPropagation();
            handleDrawingStart(e);
          } else if (!showDrawing) {
            handleMouseDown(e);
          }
        }}
        onMouseMove={(e) => {
          if (showDrawing && isDrawing && !dragging) {
            e.preventDefault();
            e.stopPropagation();
            handleDrawingMove(e);
          } else if (!showDrawing) {
            handleMouseMove(e);
          }
        }}
        onMouseUp={(e) => {
          if (showDrawing && isDrawing) {
            e.preventDefault();
            e.stopPropagation();
            handleDrawingEnd(e);
          } else if (!showDrawing) {
            handleMouseUp();
          }
        }}
        onMouseLeave={(e) => {
          if (showDrawing && isDrawing) {
            e.preventDefault();
            e.stopPropagation();
            handleDrawingEnd(e);
          } else if (!showDrawing) {
            handleMouseUp();
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isPanning ? "grabbing" : dragging ? "grabbing" : showDrawing ? "crosshair" : "grab" }}
      >
        {/* Floor Plan Background */}
        {floorPlan ? (
          <div
            className="absolute inset-0 relative group"
            style={{
              backgroundImage: `url(${floorPlan.image_path})`,
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              width: "100%",
              height: "100%",
            }}
          >
            {/* Delete Floor Plan Button */}
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-30 bg-destructive/90 hover:bg-destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm("Möchten Sie den Grundriss wirklich löschen?")) {
                  deleteFloorPlanMutation.mutate(floorPlan.id);
                }
              }}
              disabled={deleteFloorPlanMutation.isPending}
            >
              <X className="w-4 h-4 mr-2" />
              {deleteFloorPlanMutation.isPending ? "Wird gelöscht..." : "Grundriss löschen"}
            </Button>
          </div>
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
            transformOrigin: "0 0",
            width: "100%",
            height: "100%",
          }}
        >
          {racks.map((rack) => {
            const position = rackPositions[rack.id] || { x: rack.position_x ?? 100, y: rack.position_y ?? 100 };
            const rotation = rackRotations[rack.id] || 0;
            const isDraggingThis = dragging === rack.id;

            return (
              <div
                key={rack.id}
                className={`absolute cursor-move select-none ${
                  isDraggingThis ? "z-50" : "z-10"
                }`}
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                }}
                onMouseDown={(e) => {
                  // Don't start drag if clicking on rotation handle
                  if ((e.target as HTMLElement).closest('.rotation-handle')) {
                    e.stopPropagation();
                    return;
                  }
                  handleRackMouseDown(e, rack.id);
                }}
                onDoubleClick={(e) => {
                  // Don't rotate if clicking on rotation handle (it has its own onClick)
                  if ((e.target as HTMLElement).closest('.rotation-handle')) {
                    e.stopPropagation();
                    return;
                  }
                  e.stopPropagation();
                  if (!isDraggingThis) {
                    handleRackRotate(rack.id);
                  }
                }}
                onClick={(e) => {
                  // Don't trigger rack click if clicking on rotation handle
                  if ((e.target as HTMLElement).closest('.rotation-handle')) {
                    e.stopPropagation();
                    return;
                  }
                  e.stopPropagation();
                  if (onRackClick && !isDraggingThis) {
                    onRackClick(rack.id);
                  }
                }}
              >
                <div className={`bg-primary text-primary-foreground rounded-lg px-3 py-2 shadow-lg border-2 border-background min-w-[120px] text-center relative transition-transform hover:scale-110 ${
                  isDraggingThis ? "opacity-80" : ""
                }`}>
                  <button
                    type="button"
                    className="rotation-handle absolute -top-2 -right-2 w-6 h-6 bg-secondary hover:bg-secondary/80 active:bg-secondary/70 rounded-full border-2 border-background cursor-pointer z-[100] flex items-center justify-center transition-all shadow-md hover:shadow-lg hover:scale-110"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("🔄 Rotation handle clicked for rack:", rack.id);
                      handleRackRotate(rack.id);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseUp={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    title="Klicken zum Drehen (45°)"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-background">
                      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.7 2.7L21 12" />
                    </svg>
                  </button>
                  <p className="font-semibold text-sm">{rack.name}</p>
                  <p className="text-xs opacity-80">{rack.etagen.length} Etagen</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawing Canvas Overlay */}
        {showDrawing && (
          <div className="absolute inset-0 z-5 pointer-events-none">
            {/* Canvas will be appended here */}
          </div>
        )}

        {/* Drawing Controls */}
        {showDrawing && (
          <div className="absolute bottom-4 left-4 right-4 z-30 bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant={drawingMode === "pencil" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawingMode("pencil")}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant={drawingMode === "rectangle" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawingMode("rectangle")}
              >
                ▭
              </Button>
              <Button
                variant={drawingMode === "line" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawingMode("line")}
              >
                ─
              </Button>
              <Button
                variant={drawingMode === "erase" ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawingMode("erase")}
              >
                🧹
              </Button>
            </div>
            <input
              type="color"
              value={drawingColor}
              onChange={(e) => setDrawingColor(e.target.value)}
              className="w-10 h-8 rounded border"
            />
            <input
              type="range"
              min="1"
              max="10"
              value={drawingLineWidth}
              onChange={(e) => setDrawingLineWidth(Number(e.target.value))}
              className="w-20"
            />
            <Button variant="outline" size="sm" onClick={handleClearDrawing}>
              <Trash2 className="w-4 h-4 mr-2" />
              Löschen
            </Button>
            <Button variant="default" size="sm" onClick={handleSaveDrawing}>
              <Save className="w-4 h-4 mr-2" />
              Speichern
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowDrawing(false)}>
              Schließen
            </Button>
          </div>
        )}

        {/* Instructions */}
        {!floorPlan && !showDrawing && (
          <div className="absolute bottom-4 left-4 right-4 text-center text-sm text-muted-foreground bg-card/80 backdrop-blur-sm rounded p-2">
            <p>Laden Sie einen Grundriss hoch oder zeichnen Sie eine eigene Karte</p>
          </div>
        )}
      </div>
    </div>
  );
};

