import type { AssignmentStatus } from "@awards/shared";
import { Badge, type BadgeProps } from "@/components/ui/badge";

const config: Record<AssignmentStatus, { label: string; variant: BadgeProps["variant"] }> = {
  PENDING: { label: "Pending", variant: "warning" },
  IN_PROGRESS: { label: "In progress", variant: "info" },
  COMPLETED: { label: "Completed", variant: "success" },
};

export function StatusBadge({ status }: { status: AssignmentStatus }) {
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}
