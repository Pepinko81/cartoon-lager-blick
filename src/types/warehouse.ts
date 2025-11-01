export interface Fach {
  id: string;
  bezeichnung: string;
  beschreibung?: string;
  bilder: Array<{ id: string; url: string }>;
}

export interface Etage {
  id: string;
  nummer: number;
  name?: string;
  faecher: Fach[];
}

export interface Rack {
  id: string;
  name: string;
  description?: string;
  position_x?: number;
  position_y?: number;
  rotation?: number; // Rotation in degrees (0-360)
  etagen: Etage[];
}

// Legacy interface for backward compatibility
export interface Slot {
  id: string;
  name: string;
  description?: string;
  images: Array<{ id: string; url: string }>;
  rackId: string;
  bilder?: Array<{ id: string; url: string }>; // German version for compatibility
}

export interface AddRackData {
  name: string;
  description?: string;
  anzahl_etagen?: number;
  slotCount?: number;
}

export interface FloorPlan {
  id: string;
  image_path: string;
  created_at: string;
  is_active: boolean;
}

export interface LogoConfig {
  id: string;
  logo_url: string;
  position_x: number;
  position_y: number;
  position_z: number;
  scale: number;
  created_at?: string;
}
