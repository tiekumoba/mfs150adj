/** Status values. Mirrors the CHECK constraints in the database schema. */
export const NOMINATION_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "FINALISED"] as const;
export type NominationStatus = (typeof NOMINATION_STATUSES)[number];

export const ASSIGNMENT_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const EVALUATION_STATUSES = ["DRAFT", "SUBMITTED"] as const;
export type EvaluationStatus = (typeof EVALUATION_STATUSES)[number];

export const MIN_SCORE = 1;
export const MAX_SCORE = 10;
