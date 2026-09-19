/**
 * ============================================================================
 *  MOCK DATA — placeholder content only.
 *  Every export in this file must be replaced with real API/database queries
 *  (see backend /api routes and the schema in backend/db/migrations).
 * ============================================================================
 */
import type { AssignmentStatus } from "@awards/shared";

// MOCK: replace with aggregate queries scoped to the signed-in adjudicator
export const mockAdjudicatorStats = {
  assignedNominations: 9,
  pendingReviews: 6,
  completedReviews: 3,
};

export interface MockAssignment {
  id: string;
  nominee: string;
  category: string;
  status: AssignmentStatus;
  dueDate: string; // ISO date
}

// MOCK: replace with `assignments` joined to nominations, categories (filtered by adjudicator_id)
export const mockAssignments: MockAssignment[] = [
  { id: "a-1001", nominee: "Dr. Kwame Mensah", category: "Lifetime Achievement", status: "PENDING", dueDate: "2026-10-05" },
  { id: "a-1002", nominee: "Abena Osei", category: "Young Professional of the Year", status: "IN_PROGRESS", dueDate: "2026-10-08" },
  { id: "a-1003", nominee: "Yaw Boateng", category: "Community Service", status: "PENDING", dueDate: "2026-10-12" },
  { id: "a-1004", nominee: "Efua Sarpong", category: "Excellence in Education", status: "COMPLETED", dueDate: "2026-09-20" },
  { id: "a-1005", nominee: "Kofi Adjei", category: "Community Service", status: "COMPLETED", dueDate: "2026-09-15" },
];

// MOCK: replace with `criteria` rows for the nomination's category
export const mockCriteria = [
  { id: "c-1", name: "Leadership" },
  { id: "c-2", name: "Contribution to MOBA" },
  { id: "c-3", name: "Professional Achievement" },
  { id: "c-4", name: "Community Impact" },
];
