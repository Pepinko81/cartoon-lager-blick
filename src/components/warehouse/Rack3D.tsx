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
  const color = hasContent ? "#ffb380" : "#ffd4b3"; // Pastel orange tones
  const emissive = hovered ? "#ffcc99" : "#000000";

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.85, 0.3, 0.85]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={hovered ? 0.4 : 0}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      <Text
        position={[0, 0.25, 0.46]}
        fontSize={0.12}
        color="#4a5568"
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

  // Calculate robust dimensions
  const maxFaecher = Math.max(...(rack.etagen || []).map(e => e.faecher.length), 1);
  const totalEtagen = (rack.etagen || []).length;

  return (
    <group ref={groupRef}>
      {/* Kein Rückwand-Panel: offener Regalrahmen */}

      {/* Etagen and Fächer */}
      {(rack.etagen || []).map((etage, etageIndex) => {
        const levelSpacing = 1.0;
        const shelfThickness = 0.12;
        const slotHeight = 0.3;
        const levelY = etageIndex * levelSpacing; // vom Boden nach oben
        
        return (
          <group key={etage.id}>
            {/* Etagenboden (liegt auf Boden + Etagenabstand) */}
            <mesh position={[0, levelY, 0]} castShadow receiveShadow>
              <boxGeometry args={[maxFaecher + 0.3, shelfThickness, 0.95]} />
              <meshStandardMaterial color="#ffb380" metalness={0.4} roughness={0.3} />
            </mesh>

            {/* Etage Label */}
            <Text
              position={[-maxFaecher / 2 - 0.6, levelY + 0.05, 0]}
              fontSize={0.18}
              color="#7ca3d9"
              anchorX="right"
              anchorY="middle"
            >
              {etage.name || `E${etage.nummer}`}
            </Text>

            {/* Fächer */}
            {(etage.faecher || []).map((fach, fachIndex) => {
              const xPos = -maxFaecher / 2 + fachIndex + 0.5;
              const yPos = levelY + (shelfThickness / 2) + (slotHeight / 2);
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

      {/* Vertikale Stützen bis zur Gesamthöhe (stehen am Boden) */}
      <mesh position={[-maxFaecher / 2 - 0.25, (totalEtagen - 1) * 0.5, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[0.08, totalEtagen + 0.5, 0.08]} />
        <meshStandardMaterial color="#7ca3d9" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[maxFaecher / 2 + 0.25, (totalEtagen - 1) * 0.5, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[0.08, totalEtagen + 0.5, 0.08]} />
        <meshStandardMaterial color="#7ca3d9" metalness={0.6} roughness={0.2} />
      </mesh>
      
      {/* Front Vertical Supports */}
      <mesh position={[-maxFaecher / 2 - 0.25, 0, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[0.08, totalEtagen + 1, 0.08]} />
        <meshStandardMaterial color="#7ca3d9" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[maxFaecher / 2 + 0.25, 0, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[0.08, totalEtagen + 1, 0.08]} />
        <meshStandardMaterial color="#7ca3d9" metalness={0.6} roughness={0.2} />
      </mesh>
      
      {/* Cross Braces */}
      {(rack.etagen || []).map((_, idx) => {
        const levelSpacing = 1.0;
        const yPos = idx * levelSpacing;
        return (
          <group key={`brace-${idx}`}>
            <mesh position={[-maxFaecher / 2 - 0.25, yPos - 0.06, 0]} castShadow>
              <boxGeometry args={[0.06, 0.06, 1]} />
              <meshStandardMaterial color="#a3c4e6" metalness={0.6} roughness={0.2} />
            </mesh>
            <mesh position={[maxFaecher / 2 + 0.25, yPos - 0.06, 0]} castShadow>
              <boxGeometry args={[0.06, 0.06, 1]} />
              <meshStandardMaterial color="#a3c4e6" metalness={0.6} roughness={0.2} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export const Rack3D = ({ rack, onSlotClick, onEdit, onEtagenManage }: Rack3DProps) => {
  // Dynamic camera based on rack size
  const maxFaecher = Math.max(...rack.etagen.map(e => e.faecher.length), 1);
  const totalEtagen = rack.etagen.length;
  const cameraZ = Math.max(10, maxFaecher, totalEtagen) + 5;
  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-border shadow-2xl relative">
      <Canvas
        key={rack.id}
        camera={{ position: [0, 1.5, cameraZ], fov: 50 }}
        shadows
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#f0f4f8"]} />
        
        {/* Warehouse Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#e8eef5" roughness={0.6} metalness={0.05} />
        </mesh>
        
        {/* Lights - Soft and diffused for cartoon look */}
        <ambientLight intensity={0.8} />
        <directionalLight 
          position={[10, 15, 5]} 
          intensity={0.9} 
          castShadow 
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-5, 10, -5]} intensity={0.3} color="#b8d4f1" />
        <pointLight position={[0, 8, 8]} intensity={0.5} color="#fff5e6" />
        <hemisphereLight intensity={0.5} color="#d4e6f5" groundColor="#c2d9ed" />
        
        {/* Rack Structure */}
        <RackStructure rack={rack} onSlotClick={onSlotClick} onEdit={onEdit} onEtagenManage={onEtagenManage} />
        
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
      {/* Rack Info Overlay */}
      <div className="absolute top-24 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-4 border border-border shadow-lg z-40">
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
