/** Response shapes shared between the API and the frontend. */
export interface HealthResponse {
  status: "ok";
  service: string;
  timestamp: string;
}

export interface CategoryDto {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface MeResponse {
  data: {
    id: string;
    email: string;
    fullName: string;
    role: import("./roles.js").Role;
  };
}
