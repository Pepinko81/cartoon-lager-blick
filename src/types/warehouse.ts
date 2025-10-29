export interface Slot {
  id: string;
  name: string;
  description?: string;
  images: string[] | Array<{ id: string; url: string }>;
  rackId: string;
}

export interface Rack {
  id: string;
  name: string;
  description?: string;
  slots: Slot[];
}

export interface AddRackData {
  name: string;
  description?: string;
  slotCount: number;
}
