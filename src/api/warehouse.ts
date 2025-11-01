import { API_BASE } from "@/config/api";
import { FloorPlan, LogoConfig } from "@/types/warehouse";

interface AuthHeader {
  Authorization: string;
}

const getAuthHeader = (): AuthHeader => {
  const token = localStorage.getItem("lager_token");
  if (!token) {
    console.warn("⚠️ No authentication token found in localStorage");
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Get base URL without /api for static files
const getBaseUrl = (): string => {
  return API_BASE.replace('/api', '');
};

// Floor Plan API Functions
export const uploadFloorPlan = async (file: File): Promise<FloorPlan> => {
  const formData = new FormData();
  formData.append("floorplan", file);

  const headers = getAuthHeader();
  // Don't set Content-Type - browser will set it automatically with boundary for multipart/form-data

  const response = await fetch(`${API_BASE}/floorplan`, {
    method: "POST",
    headers: headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.nachricht || "Fehler beim Hochladen des Grundrisses");
  }

  const data = await response.json();
  return data.daten;
};

export const getFloorPlan = async (): Promise<FloorPlan | null> => {
  const response = await fetch(`${API_BASE}/floorplan`, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.nachricht || "Fehler beim Laden des Grundrisses");
  }

  return await response.json();
};

export const setFloorPlanActive = async (id: string): Promise<FloorPlan> => {
  const response = await fetch(`${API_BASE}/floorplan/${id}`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.nachricht || "Fehler beim Aktivieren des Grundrisses");
  }

  const data = await response.json();
  return data.daten;
};

export const deleteFloorPlan = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/floorplan/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.nachricht || "Fehler beim Löschen des Grundrisses");
  }
};

// Logo API Functions
export const uploadLogo = async (file: File): Promise<LogoConfig> => {
  const formData = new FormData();
  formData.append("logo", file);

  const headers = getAuthHeader();
  // Don't set Content-Type - browser will set it automatically with boundary for multipart/form-data

  const response = await fetch(`${API_BASE}/logo`, {
    method: "POST",
    headers: headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.nachricht || "Fehler beim Hochladen des Logos");
  }

  const data = await response.json();
  // Backend returns logo_url as relative path, need to construct full URL
  const baseUrl = getBaseUrl();
  const logoUrl = data.daten.logo_url?.startsWith('http') 
    ? data.daten.logo_url 
    : data.daten.logo_url?.startsWith('/')
    ? `${baseUrl}${data.daten.logo_url}`
    : `${baseUrl}/logos/${data.daten.logo_url}`;
  
  return {
    id: data.daten.id,
    logo_url: logoUrl,
    position_x: data.daten.position_x,
    position_y: data.daten.position_y,
    position_z: data.daten.position_z,
    scale: data.daten.scale,
  };
};

export const getLogoConfig = async (): Promise<LogoConfig | null> => {
  const response = await fetch(`${API_BASE}/logo`, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.nachricht || "Fehler beim Laden des Logos");
  }

  const data = await response.json();
  // Backend already returns full URL, but handle both cases
  const baseUrl = getBaseUrl();
  return {
    ...data,
    logo_url: data.logo_url?.startsWith('http') 
      ? data.logo_url 
      : data.logo_url?.startsWith('/')
      ? `${baseUrl}${data.logo_url}`
      : `${baseUrl}/logos/${data.logo_url}`,
  };
};

export const updateLogoPosition = async (
  id: string,
  position: {
    position_x?: number;
    position_y?: number;
    position_z?: number;
    scale?: number;
  }
): Promise<LogoConfig> => {
  const response = await fetch(`${API_BASE}/logo/${id}`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(position),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.nachricht || "Fehler beim Aktualisieren des Logos");
  }

  const data = await response.json();
  // Backend already returns full URL, but handle both cases
  const baseUrl = getBaseUrl();
  return {
    ...data.daten,
    logo_url: data.daten.logo_url?.startsWith('http') 
      ? data.daten.logo_url 
      : data.daten.logo_url?.startsWith('/')
      ? `${baseUrl}${data.daten.logo_url}`
      : `${baseUrl}/logos/${data.daten.logo_url}`,
  };
};

export const deleteLogo = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/logo/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.nachricht || "Fehler beim Löschen des Logos");
  }
};

// Rack Position API Functions
export const updateRackPosition = async (
  rackId: string,
  position_x: number | null,
  position_y: number | null
): Promise<void> => {
  const response = await fetch(`${API_BASE}/regal/${rackId}`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ position_x, position_y }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.nachricht || "Fehler beim Aktualisieren der Regal-Position");
  }
};

