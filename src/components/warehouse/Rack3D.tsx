import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { Rack as RackType, Fach } from "@/types/warehouse";
import { exportRackAsGLTF, buildExportableScene } from "@/utils/sceneExporter";
import { toast } from "sonner";
import { BrandingConfig, loadBrandingConfig } from "@/config/branding";

interface Rack3DProps {
  rack: RackType;
  onSlotClick: (slotId: string) => void;
  onEdit: (rackId: string) => void;
  onEtagenManage: (rackId: string) => void;
  brandingPreset?: string; // Optional: Name des Branding-Presets
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

interface BrandedFloorProps {
  branding: BrandingConfig;
}

const BrandedFloor = ({ branding }: BrandedFloorProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (branding.floor.textureUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(
        branding.floor.textureUrl,
        (loadedTexture) => {
          loadedTexture.wrapS = THREE.RepeatWrapping;
          loadedTexture.wrapT = THREE.RepeatWrapping;
          loadedTexture.repeat.set(10, 10);
          setTexture(loadedTexture);
        },
        undefined,
        (error) => {
          console.error("Fehler beim Laden der Boden-Textur:", error);
        }
      );
    }
  }, [branding.floor.textureUrl]);

  return (
    <mesh 
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0, 0]} 
      receiveShadow
    >
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial
        color={branding.floor.color}
        map={texture}
        roughness={branding.floor.roughness}
        metalness={branding.floor.metalness}
      />
    </mesh>
  );
};

interface BrandedBackgroundProps {
  branding: BrandingConfig;
}

const BrandedBackground = ({ branding }: BrandedBackgroundProps) => {
  const [logoTexture, setLogoTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (branding.background.logoUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(
        branding.background.logoUrl,
        (loadedTexture) => {
          setLogoTexture(loadedTexture);
        },
        undefined,
        (error) => {
          console.error("Fehler beim Laden des Logos:", error);
        }
      );
    }
  }, [branding.background.logoUrl]);

  return (
    <group>
      {/* Gewölbte Hintergrundwand - Точно зад регала */}
      <mesh position={[0, 5, -6]} receiveShadow>
        <cylinderGeometry args={[20, 20, 15, 32, 1, true, 0, Math.PI]} />
        <meshStandardMaterial
          color={branding.background.color}
          side={THREE.BackSide}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Logo-Plane (falls Logo vorhanden) - Точно зад регала */}
      {logoTexture && (
        <mesh position={[0, 5, -5.8]} castShadow>
          <planeGeometry args={[branding.background.logoScale, branding.background.logoScale]} />
          <meshStandardMaterial
            map={logoTexture}
            transparent={true}
            opacity={0.9}
            roughness={0.5}
            metalness={0.1}
          />
        </mesh>
      )}
    </group>
  );
};

const RackStructure = ({ rack, onSlotClick }: Rack3DProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useThree();

  // Calculate robust dimensions
  const maxFaecher = Math.max(...(rack.etagen || []).map(e => e.faecher.length), 1);
  const totalEtagen = (rack.etagen || []).length;
  const levelSpacing = 1.0; // Константа за разстоянието между етажите

  return (
    <group ref={groupRef} rotation={[0, -Math.PI / 2, 0]}>
      {/* Kein Rückwand-Panel: offener Regalrahmen */}
      {/* Regal um 270 Grad gedreht (rotation auf Y-Achse) - общо 270° от началната позиция */}

      {/* Etagen and Fächer */}
      {(rack.etagen || []).map((etage, etageIndex) => {
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

            {/* Etage Label - От ляво, на дъното на етажа, перпендикулярно на регала, гледа към камерата */}
            <Text
              position={[-maxFaecher / 2 - 0.6, levelY, 0]}
              fontSize={0.18}
              color="#7ca3d9"
              anchorX="right"
              anchorY="bottom"
              rotation={[0, 0, 0]}
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

      {/* Hintere vertikale Stützen (Back Posts) - на същата x позиция, зад регала */}
      <mesh position={[-maxFaecher / 2 - 0.25, (totalEtagen * 0.5), -0.5]} castShadow receiveShadow>
        <boxGeometry args={[0.08, totalEtagen * levelSpacing + 0.2, 0.08]} />
        <meshStandardMaterial color="#7ca3d9" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[maxFaecher / 2 + 0.25, (totalEtagen * 0.5), -0.5]} castShadow receiveShadow>
        <boxGeometry args={[0.08, totalEtagen * levelSpacing + 0.2, 0.08]} />
        <meshStandardMaterial color="#7ca3d9" metalness={0.6} roughness={0.2} />
      </mesh>
      
      {/* Предни vertikale Stützen (Front Posts) - на същите x позиции като задните, но напред */}
      <mesh position={[-maxFaecher / 2 - 0.25, (totalEtagen * 0.5), 0.5]} castShadow receiveShadow>
        <boxGeometry args={[0.08, totalEtagen * levelSpacing + 0.2, 0.08]} />
        <meshStandardMaterial color="#7ca3d9" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[maxFaecher / 2 + 0.25, (totalEtagen * 0.5), 0.5]} castShadow receiveShadow>
        <boxGeometry args={[0.08, totalEtagen * levelSpacing + 0.2, 0.08]} />
        <meshStandardMaterial color="#7ca3d9" metalness={0.6} roughness={0.2} />
      </mesh>
      
      {/* Cross Braces */}
      {(rack.etagen || []).map((_, idx) => {
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

export const Rack3D = ({ rack, onSlotClick, onEdit, onEtagenManage, brandingPreset = "default" }: Rack3DProps) => {
  const [branding, setBranding] = useState<BrandingConfig>(() => loadBrandingConfig(brandingPreset));

  const handleExport = (format: 'glb' | 'gltf') => {
    const exportScene = buildExportableScene(rack, branding);
    exportRackAsGLTF(exportScene, rack, format);
    toast.success(`${rack.name}.${format} wurde heruntergeladen`);
  };

  const handleBrandingChange = (preset: string) => {
    const newBranding = loadBrandingConfig(preset);
    setBranding(newBranding);
    toast.success(`Branding zu "${preset}" gewechselt`);
  };

  // Dynamic camera based on rack size - повдигната по-високо и центрирана
  const maxFaecher = Math.max(...rack.etagen.map(e => e.faecher.length), 1);
  const totalEtagen = rack.etagen.length;
  const levelSpacing = 1.0;
  const rackHeight = totalEtagen * levelSpacing;
  const cameraDistance = Math.max(12, maxFaecher * 1.5, rackHeight * 1.5);
  const cameraY = rackHeight / 2 + 2.5; // Повдигната по-високо от средата на регала
  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-border shadow-2xl relative">
      <Canvas
        key={rack.id}
        camera={{ position: [-cameraDistance, cameraY, 0], fov: 50 }}
        shadows
        gl={{ antialias: true }}
      >
        <color attach="background" args={[branding.background.color]} />
        
        {/* Branded Background */}
        <BrandedBackground branding={branding} />
        
        {/* Branded Floor */}
        <BrandedFloor branding={branding} />
        
        {/* Lights - Soft and diffused for cartoon look */}
        <ambientLight intensity={0.8} />
        <directionalLight 
          position={[-10, 15, -5]} 
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
        <directionalLight position={[5, 10, 5]} intensity={0.3} color="#b8d4f1" />
        <pointLight position={[0, 8, -8]} intensity={0.5} color="#fff5e6" />
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
        {/* Branding Selector */}
        <div className="relative group">
          <button
            className="px-2 py-1 text-xs rounded bg-card hover:bg-accent border border-border shadow"
          >
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0a4 4 0 004-4v-4a2 2 0 012-2h4a2 2 0 012 2v4a4 4 0 01-4 4h-8z" /></svg>
              Branding
            </span>
          </button>
          <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <button
              onClick={() => handleBrandingChange('default')}
              className="w-full px-3 py-2 text-xs text-left hover:bg-accent"
            >
              Standard
            </button>
            <button
              onClick={() => handleBrandingChange('tech-blue')}
              className="w-full px-3 py-2 text-xs text-left hover:bg-accent"
            >
              Tech Blue
            </button>
            <button
              onClick={() => handleBrandingChange('modern-dark')}
              className="w-full px-3 py-2 text-xs text-left hover:bg-accent"
            >
              Modern Dark
            </button>
            <button
              onClick={() => handleBrandingChange('eco-green')}
              className="w-full px-3 py-2 text-xs text-left hover:bg-accent"
            >
              Eco Green
            </button>
          </div>
        </div>
        
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
        <div className="relative group">
          <button
            className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 border border-border shadow"
          >
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>
              3D Export
            </span>
          </button>
          <div className="absolute right-0 mt-1 w-32 bg-card border border-border rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <button
              onClick={() => handleExport('glb')}
              className="w-full px-3 py-2 text-xs text-left hover:bg-accent rounded-t"
            >
              Als .GLB
            </button>
            <button
              onClick={() => handleExport('gltf')}
              className="w-full px-3 py-2 text-xs text-left hover:bg-accent rounded-b"
            >
              Als .GLTF
            </button>
          </div>
        </div>
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
