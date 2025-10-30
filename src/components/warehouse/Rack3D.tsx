import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { Rack as RackType, Fach } from "@/types/warehouse";

interface Rack3DProps {
  rack: RackType;
  onSlotClick: (slotId: string) => void;
  onEdit: (rackId: string) => void;
  onEtagenManage: (rackId: string) => void;
}

interface SlotBoxProps {
  position: [number, number, number];
  fach: Fach;
  onClick: () => void;
  etageIndex: number;
  fachIndex: number;
}

const SlotBox = ({ position, fach, onClick, etageIndex, fachIndex }: SlotBoxProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current && hovered) {
      meshRef.current.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.1);
    } else if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  const hasContent = fach.bilder.length > 0 || fach.beschreibung;
  const color = hasContent ? "#f97316" : "#64748b"; // Orange if has content, gray otherwise
  const emissive = hovered ? "#fbbf24" : "#000000";

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={hovered ? 0.5 : 0}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      <Text
        position={[0, 0, 0.5]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {fach.bezeichnung}
      </Text>
    </group>
  );
};

const RackStructure = ({ rack, onSlotClick }: Rack3DProps) => {
  const groupRef = useRef<THREE.Group>(null);

  // Calculate dimensions
  const maxFaecher = Math.max(...rack.etagen.map(e => e.faecher.length));
  const totalEtagen = rack.etagen.length;

  return (
    <group ref={groupRef}>
      {/* Rack Frame - Back Panel */}
      <mesh position={[0, 0, -0.5]}>
        <boxGeometry args={[maxFaecher + 0.5, totalEtagen + 0.5, 0.1]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Etagen and Fächer */}
      {rack.etagen.map((etage, etageIndex) => {
        const yPos = totalEtagen / 2 - etageIndex - 0.5;
        
        return (
          <group key={etage.id}>
            {/* Etage Shelf */}
            <mesh position={[0, yPos - 0.5, 0]}>
              <boxGeometry args={[maxFaecher + 0.3, 0.1, 1]} />
              <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.5} />
            </mesh>

            {/* Etage Label */}
            <Text
              position={[-maxFaecher / 2 - 0.5, yPos, 0]}
              fontSize={0.2}
              color="#f1f5f9"
              anchorX="right"
              anchorY="middle"
            >
              {etage.name || `E${etage.nummer}`}
            </Text>

            {/* Fächer */}
            {etage.faecher.map((fach, fachIndex) => {
              const xPos = -maxFaecher / 2 + fachIndex + 0.5;
              return (
                <SlotBox
                  key={fach.id}
                  position={[xPos, yPos, 0]}
                  fach={fach}
                  onClick={() => onSlotClick(fach.id)}
                  etageIndex={etageIndex}
                  fachIndex={fachIndex}
                />
              );
            })}
          </group>
        );
      })}

      {/* Vertical Supports */}
      <mesh position={[-maxFaecher / 2 - 0.2, 0, -0.5]}>
        <boxGeometry args={[0.1, totalEtagen + 1, 0.1]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[maxFaecher / 2 + 0.2, 0, -0.5]}>
        <boxGeometry args={[0.1, totalEtagen + 1, 0.1]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

export const Rack3D = ({ rack, onSlotClick, onEdit, onEtagenManage }: Rack3DProps) => {
  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-border shadow-2xl relative">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#0f172a"]} />
        
        {/* Lights */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <pointLight position={[0, 5, 5]} intensity={0.5} color="#fbbf24" />
        
        {/* Rack Structure */}
        <RackStructure rack={rack} onSlotClick={onSlotClick} />
        
        {/* Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          minDistance={5}
          maxDistance={20}
        />
      </Canvas>
      {/* Overlay Buttons outside Canvas for persistency */}
      <div className="absolute top-4 right-4 flex gap-2 z-50 pointer-events-auto">
        <button
          onClick={() => onEdit(rack.id)}
          className="px-2 py-1 text-xs rounded bg-card hover:bg-accent border border-border shadow"
        >
          <span className="inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15.232 5.232l3.536 3.536a2 2 0 010 2.828l-7.071 7.071A2 2 0 019.12 19.12l-3.535-3.535a2 2 0 010-2.829l7.07-7.07a2 2 0 012.828 0z" /></svg>
            Bearbeiten
          </span>
        </button>
        <button
          onClick={() => onEtagenManage(rack.id)}
          className="px-2 py-1 text-xs rounded bg-card hover:bg-accent border border-border shadow"
        >
          <span className="inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 4v16m8-8H4" /></svg>
            Etagen verwalten
          </span>
        </button>
      </div>
      {/* rack info overlay can remain as before */}
      <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-4 border border-border shadow-lg z-40">
        <h3 className="text-lg font-bold text-foreground mb-1">{rack.name}</h3>
        {rack.description && (
          <p className="text-sm text-muted-foreground">{rack.description}</p>
        )}
        <div className="mt-2 text-xs text-muted-foreground">
          <p>{rack.etagen.length} Etagen</p>
          <p className="mt-1 text-xs opacity-70">Klicken & Ziehen zum Drehen</p>
        </div>
      </div>
    </div>
  );
};
