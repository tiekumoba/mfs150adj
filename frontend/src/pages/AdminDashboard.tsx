import { Award, CheckCircle2, ClipboardList, Users } from "lucide-react";
import { MockDataNotice, PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockAdminRecentAssignments, mockAdminStats } from "@/mocks/data";

export default function AdminDashboard() {
  const stats = mockAdminStats; // MOCK
  return (
    <>
      <PageHeader title="Dashboard" description="Overview of nominations and adjudication progress." />
      <MockDataNotice />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Nominations" value={stats.totalNominations} icon={Award} />
        <StatCard label="Total Adjudicators" value={stats.totalAdjudicators} icon={Users} />
        <StatCard label="Pending Assignments" value={stats.pendingAssignments} icon={ClipboardList} />
        <StatCard label="Completed Evaluations" value={stats.completedEvaluations} icon={CheckCircle2} />
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent assignments</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nominee</TableHead>
              <TableHead>Award Category</TableHead>
              <TableHead>Adjudicator</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockAdminRecentAssignments.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.nominee}</TableCell>
                <TableCell>{a.category}</TableCell>
                <TableCell>{a.adjudicator}</TableCell>
                <TableCell><StatusBadge status={a.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
