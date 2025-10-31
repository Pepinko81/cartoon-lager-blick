/**
 * White-Label Branding Configuration
 * 
 * Diese Konfiguration ermöglicht die visuelle Anpassung der 3D-Szene
 * für verschiedene Firmen ohne Code-Änderungen.
 */

export interface BrandingConfig {
  floor: {
    color: string;
    roughness: number;
    metalness: number;
    textureUrl?: string; // Optional: Pfad zu einer Boden-Textur
  };
  background: {
    color: string;
    logoUrl?: string; // Optional: Pfad zum Firmenlogo
    logoScale: number; // Skalierung des Logos
    logoPosition: [number, number, number]; // Position des Logos [x, y, z]
  };
  company: {
    name: string;
    primaryColor?: string;
  };
}

/**
 * Standard-Branding (Neutral / Demo)
 */
export const defaultBranding: BrandingConfig = {
  floor: {
    color: "#e8eef5",
    roughness: 0.6,
    metalness: 0.05,
  },
  background: {
    color: "#f0f4f8",
    logoScale: 3,
    logoPosition: [0, 5, -10],
  },
  company: {
    name: "Warehouse System",
  },
};

/**
 * Beispiel-Branding für verschiedene Firmen
 */
export const brandingPresets: Record<string, BrandingConfig> = {
  default: defaultBranding,
  
  "tech-blue": {
    floor: {
      color: "#d4e6f5",
      roughness: 0.5,
      metalness: 0.1,
    },
    background: {
      color: "#e3f2fd",
      logoScale: 3,
      logoPosition: [0, 5, -10],
    },
    company: {
      name: "Tech Company",
      primaryColor: "#2196F3",
    },
  },
  
  "modern-dark": {
    floor: {
      color: "#2d3748",
      roughness: 0.4,
      metalness: 0.2,
    },
    background: {
      color: "#1a202c",
      logoScale: 3,
      logoPosition: [0, 5, -10],
    },
    company: {
      name: "Modern Logistics",
      primaryColor: "#4a5568",
    },
  },
  
  "eco-green": {
    floor: {
      color: "#e8f5e9",
      roughness: 0.5,
      metalness: 0.05,
    },
    background: {
      color: "#f1f8e9",
      logoScale: 3,
      logoPosition: [0, 5, -10],
    },
    company: {
      name: "Green Storage",
      primaryColor: "#66bb6a",
    },
  },
};

/**
 * Lädt Branding-Konfiguration
 * Kann später erweitert werden, um von API zu laden
 */
export function loadBrandingConfig(presetName: string = "default"): BrandingConfig {
  return brandingPresets[presetName] || defaultBranding;
}

/**
 * Funktion zum dynamischen Aktualisieren des Brandings
 * Kann von außen aufgerufen werden, um Branding zur Laufzeit zu ändern
 */
export function updateBranding(config: Partial<BrandingConfig>): BrandingConfig {
  return {
    ...defaultBranding,
    ...config,
    floor: {
      ...defaultBranding.floor,
      ...(config.floor || {}),
    },
    background: {
      ...defaultBranding.background,
      ...(config.background || {}),
    },
    company: {
      ...defaultBranding.company,
      ...(config.company || {}),
    },
  };
}
