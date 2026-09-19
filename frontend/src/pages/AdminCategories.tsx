import { Link } from "react-router-dom";
import type { CategoryDto } from "@awards/shared";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/lib/useApiQuery";

export default function AdminCategories() {
  const { data, loading, error } = useApiQuery<{ data: CategoryDto[] }>("/api/categories");
  return (
    <>
      <PageHeader title="Categories" description="Award categories and how many nominations each has received." />
      <Card>
        <QueryState loading={loading} error={error} />
        {data && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Award Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Nominations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link className="hover:underline" to={`/admin/nominations?categoryId=${c.id}`}>{c.name}</Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.isActive ? "success" : "secondary"}>{c.isActive ? "Active" : "Inactive"}</Badge>
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
