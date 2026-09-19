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
  /** Number of submitted or draft evaluations. Editing after scoring has started affects them. */
  evaluationCount: number;
}

export interface NominationUpdate {
  nomineeName?: string;
  nominatorName?: string | null;
  citation?: string | null;
  categoryId?: string;
}

export interface AuditChange {
  field: string;
  from: string | null;
  to: string | null;
}

export interface AuditEntryDto {
  id: string;
  action: string;
  actorName: string | null;
  actorEmail: string | null;
  source: "web" | "import" | "script";
  ipAddress: string | null;
  createdAt: string;
  changes: AuditChange[];
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

export interface AdjudicatorDto {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  /** True once the person has signed in with Clerk at least once. */
  hasSignedIn: boolean;
  assignmentCount: number;
  createdAt: string;
}
