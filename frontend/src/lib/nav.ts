import {
  Award,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  Settings,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

export const adminNav: NavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "Nominations", to: "/admin/nominations", icon: Award },
  { label: "Categories", to: "/admin/categories", icon: FolderTree },
  { label: "Adjudicators", to: "/admin/adjudicators", icon: Users },
  { label: "Assignments", to: "/admin/assignments", icon: ClipboardList },
  { label: "Evaluations", to: "/admin/evaluations", icon: ClipboardCheck },
  { label: "Results", to: "/admin/results", icon: BarChart3 },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

export const adjudicatorNav: NavItem[] = [
  { label: "Dashboard", to: "/adjudicator", icon: LayoutDashboard, end: true },
  { label: "Sample Evaluation", to: "/adjudicator/evaluations/a-1001", icon: UserCheck },
];
