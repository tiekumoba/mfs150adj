import { Award, CheckCircle2, ClipboardList, Users } from "lucide-react";
import { Link } from "react-router-dom";
import type { AdminStats, CategoryDto } from "@awards/shared";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/lib/useApiQuery";

export default function AdminDashboard() {
  const stats = useApiQuery<{ data: AdminStats }>("/api/admin/stats");
  const categories = useApiQuery<{ data: CategoryDto[] }>("/api/categories");
  const s = stats.data?.data;

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of nominations and adjudication progress." />
      <QueryState loading={stats.loading} error={stats.error} />
      {s && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Nominations" value={s.totalNominations} icon={Award} />
          <StatCard label="Total Adjudicators" value={s.totalAdjudicators} icon={Users} />
          <StatCard label="Pending Assignments" value={s.pendingAssignments} icon={ClipboardList} />
          <StatCard label="Completed Evaluations" value={s.completedEvaluations} icon={CheckCircle2} />
        </div>
      )}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Nominations by category</CardTitle>
        </CardHeader>
        <QueryState loading={categories.loading} error={categories.error} />
        {categories.data && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Award Category</TableHead>
                <TableHead className="text-right">Nominations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.data.data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link className="hover:underline" to={`/admin/nominations?categoryId=${c.id}`}>{c.name}</Link>
                  </TableCell>
                  <TableCell className="text-right">{c.nominationCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
