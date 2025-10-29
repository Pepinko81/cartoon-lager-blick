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
  etagen: Etage[];
}

// Legacy interface for backward compatibility
export interface Slot {
  id: string;
  name: string;
  description?: string;
  images: string[] | Array<{ id: string; url: string }>;
  rackId: string;
}

export interface AddRackData {
  name: string;
  description?: string;
  anzahl_etagen?: number;
  slotCount?: number;
}
