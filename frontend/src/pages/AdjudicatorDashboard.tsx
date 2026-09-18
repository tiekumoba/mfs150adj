import { CheckCircle2, ClipboardList, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { MockDataNotice, PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { mockAdjudicatorStats, mockAssignments } from "@/mocks/data";

export default function AdjudicatorDashboard() {
  const stats = mockAdjudicatorStats; // MOCK
  return (
    <>
      <PageHeader title="My Dashboard" description="Nominations assigned to you for review." />
      <MockDataNotice />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Assigned Nominations" value={stats.assignedNominations} icon={ClipboardList} />
        <StatCard label="Pending Reviews" value={stats.pendingReviews} icon={Clock} />
        <StatCard label="Completed Reviews" value={stats.completedReviews} icon={CheckCircle2} />
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nominee</TableHead>
              <TableHead>Award Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockAssignments.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.nominee}</TableCell>
                <TableCell>{a.category}</TableCell>
                <TableCell><StatusBadge status={a.status} /></TableCell>
                <TableCell>{formatDate(a.dueDate)}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant={a.status === "COMPLETED" ? "outline" : "default"} asChild>
                    <Link to={`/adjudicator/evaluations/${a.id}`}>
                      {a.status === "COMPLETED" ? "View" : a.status === "IN_PROGRESS" ? "Continue" : "Evaluate"}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
