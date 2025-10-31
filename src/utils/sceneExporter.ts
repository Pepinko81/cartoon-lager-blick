import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { Rack } from "@/types/warehouse";
import { BrandingConfig, defaultBranding } from "@/config/branding";

export const exportRackAsGLTF = (scene: THREE.Scene, rack: Rack, format: 'glb' | 'gltf' = 'glb') => {
  const exporter = new GLTFExporter();
  
  const options = {
    binary: format === 'glb',
    trs: false,
    onlyVisible: true,
    truncateDrawRange: true,
    embedImages: true,
    maxTextureSize: 4096,
  };

  exporter.parse(
    scene,
    (result) => {
      if (result instanceof ArrayBuffer) {
        // GLB binary format
        saveArrayBuffer(result, `${rack.name}.glb`);
      } else {
        // GLTF JSON format
        const output = JSON.stringify(result, null, 2);
        saveString(output, `${rack.name}.gltf`);
      }
    },
    (error) => {
      console.error('Export error:', error);
    },
    options
  );
};

const saveArrayBuffer = (buffer: ArrayBuffer, filename: string) => {
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.style.display = 'none';
  document.body.appendChild(link);
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  document.body.removeChild(link);
};

const saveString = (text: string, filename: string) => {
  const blob = new Blob([text], { type: 'text/plain' });
  const link = document.createElement('a');
  link.style.display = 'none';
  document.body.appendChild(link);
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  document.body.removeChild(link);
};

export const buildExportableScene = (rack: Rack, branding: BrandingConfig = defaultBranding): THREE.Scene => {
  const scene = new THREE.Scene();
  scene.name = "WarehouseScene";

  // Add branded floor
  const floorGeometry = new THREE.PlaneGeometry(50, 50);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: branding.floor.color,
    roughness: branding.floor.roughness,
    metalness: branding.floor.metalness,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.name = "Floor";
  scene.add(floor);

  // Add branded background wall
  const backgroundGeometry = new THREE.CylinderGeometry(20, 20, 15, 32, 1, true, 0, Math.PI);
  const backgroundMaterial = new THREE.MeshStandardMaterial({
    color: branding.background.color,
    side: THREE.BackSide,
    roughness: 0.7,
    metalness: 0.1,
  });
  const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
  background.position.set(0, 5, -15);
  background.name = "Background";
  scene.add(background);

  const rackGroup = new THREE.Group();
  rackGroup.name = rack.name || `Regal_${rack.id}`;

  const maxFaecher = Math.max(...rack.etagen.map(e => e.faecher.length), 1);
  const totalEtagen = rack.etagen.length;

  // Vertical supports (blue metal)
  const supportMaterial = new THREE.MeshStandardMaterial({
    color: 0x7ca3d9,
    metalness: 0.6,
    roughness: 0.2,
  });

  const backLeftSupport = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, totalEtagen + 0.5, 0.08),
    supportMaterial
  );
  backLeftSupport.position.set(-maxFaecher / 2 - 0.25, (totalEtagen - 1) * 0.5, -0.5);
  backLeftSupport.name = "Support_BackLeft";
  rackGroup.add(backLeftSupport);

  const backRightSupport = backLeftSupport.clone();
  backRightSupport.position.set(maxFaecher / 2 + 0.25, (totalEtagen - 1) * 0.5, -0.5);
  backRightSupport.name = "Support_BackRight";
  rackGroup.add(backRightSupport);

  const frontLeftSupport = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, totalEtagen + 1, 0.08),
    supportMaterial
  );
  frontLeftSupport.position.set(-maxFaecher / 2 - 0.25, 0, 0.5);
  frontLeftSupport.name = "Support_FrontLeft";
  rackGroup.add(frontLeftSupport);

  const frontRightSupport = frontLeftSupport.clone();
  frontRightSupport.position.set(maxFaecher / 2 + 0.25, 0, 0.5);
  frontRightSupport.name = "Support_FrontRight";
  rackGroup.add(frontRightSupport);

  // Etagen and Fächer
  const shelfMaterial = new THREE.MeshStandardMaterial({
    color: 0xffb380,
    metalness: 0.4,
    roughness: 0.3,
  });

  rack.etagen.forEach((etage, etageIndex) => {
    const etageGroup = new THREE.Group();
    etageGroup.name = etage.name || `Etage_${etage.nummer}`;

    const levelSpacing = 1.0;
    const shelfThickness = 0.12;
    const slotHeight = 0.3;
    const levelY = etageIndex * levelSpacing;

    // Shelf floor
    const shelfFloor = new THREE.Mesh(
      new THREE.BoxGeometry(maxFaecher + 0.3, shelfThickness, 0.95),
      shelfMaterial
    );
    shelfFloor.position.set(0, levelY, 0);
    shelfFloor.name = `${etageGroup.name}_Floor`;
    etageGroup.add(shelfFloor);

    // Cross braces
    const braceMaterial = new THREE.MeshStandardMaterial({
      color: 0xa3c4e6,
      metalness: 0.6,
      roughness: 0.2,
    });

    const braceLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 1),
      braceMaterial
    );
    braceLeft.position.set(-maxFaecher / 2 - 0.25, levelY - 0.06, 0);
    braceLeft.name = `${etageGroup.name}_BraceLeft`;
    etageGroup.add(braceLeft);

    const braceRight = braceLeft.clone();
    braceRight.position.set(maxFaecher / 2 + 0.25, levelY - 0.06, 0);
    braceRight.name = `${etageGroup.name}_BraceRight`;
    etageGroup.add(braceRight);

    // Fächer (compartments)
    const slotMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd4b3,
      metalness: 0.3,
      roughness: 0.4,
    });

    etage.faecher.forEach((fach, fachIndex) => {
      const fachMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.3, 0.85),
        fach.bilder.length > 0 || fach.beschreibung ? 
          new THREE.MeshStandardMaterial({ color: 0xffb380, metalness: 0.3, roughness: 0.4 }) : 
          slotMaterial.clone()
      );
      
      const xPos = -maxFaecher / 2 + fachIndex + 0.5;
      const yPos = levelY + (shelfThickness / 2) + (slotHeight / 2);
      
      fachMesh.position.set(xPos, yPos, 0);
      fachMesh.name = fach.bezeichnung || `Fach_${fachIndex + 1}`;
      
      etageGroup.add(fachMesh);
    });

    rackGroup.add(etageGroup);
  });

  // Add rack group to scene
  scene.add(rackGroup);

  // Center the rack at origin (floor and background stay in place)
  const box = new THREE.Box3().setFromObject(rackGroup);
  const center = box.getCenter(new THREE.Vector3());
  rackGroup.position.sub(center);

  return scene;
};
