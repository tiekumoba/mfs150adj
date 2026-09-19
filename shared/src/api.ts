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
  nominationCount: number;
}

export type EvidenceKind = "image" | "document" | "video" | "external_link";

export interface NominationDocumentDto {
  id: string;
  kind: EvidenceKind;
  url: string;
  fileName: string | null;
}

export interface NominationListItem {
  id: string;
  nomineeName: string;
  nominatorName: string | null;
  categoryId: string;
  categoryName: string;
  status: string;
  documentCount: number;
}

export interface NominationDetail extends Omit<NominationListItem, "documentCount"> {
  citation: string | null;
  documents: NominationDocumentDto[];
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminStats {
  totalNominations: number;
  totalAdjudicators: number;
  pendingAssignments: number;
  completedEvaluations: number;
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
