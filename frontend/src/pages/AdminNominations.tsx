import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Paperclip } from "lucide-react";
import type { CategoryDto, NominationListItem, Paginated } from "@awards/shared";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/lib/useApiQuery";

const PAGE_SIZE = 25;

export default function AdminNominations() {
  const [params, setParams] = useSearchParams();
  const categoryId = params.get("categoryId") ?? "";
  const q = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  // Search box updates immediately; the URL (and the request) follow after a short pause.
  const [search, setSearch] = useState(q);
  useEffect(() => {
    if (search === q) return;
    const timer = setTimeout(() => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (search) next.set("q", search);
        else next.delete("q");
        next.delete("page");
        return next;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, q, setParams]);

  function update(key: string, value: string) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.delete("page");
      return next;
    });
  }

  const categories = useApiQuery<{ data: CategoryDto[] }>("/api/categories");
  const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (categoryId) query.set("categoryId", categoryId);
  if (q) query.set("q", q);
  const { data, loading, error } = useApiQuery<Paginated<NominationListItem>>(`/api/nominations?${query}`);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <PageHeader title="Nominations" description="All nominations received across award categories." />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          className="w-full sm:w-72"
          placeholder="Search nominee or nominator…"
          aria-label="Search nominations"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="h-9 rounded-md border border-input bg-card px-3 text-sm"
          aria-label="Filter by category"
          value={categoryId}
          onChange={(e) => update("categoryId", e.target.value)}
        >
          <option value="">All categories</option>
          {categories.data?.data.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.nominationCount})</option>
          ))}
        </select>
      </div>
      <Card>
        <QueryState loading={loading} error={error} />
        {data && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nominee</TableHead>
                  <TableHead>Award Category</TableHead>
                  <TableHead>Nominated by</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No nominations found.</TableCell>
                  </TableRow>
                )}
                {data.data.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">{n.nomineeName}</TableCell>
                    <TableCell>{n.categoryName}</TableCell>
                    <TableCell>{n.nominatorName ?? "—"}</TableCell>
                    <TableCell>
                      {n.documentCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Paperclip className="size-3.5" /> {n.documentCount}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/admin/nominations/${n.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
              <span>{data.total} nominations · page {data.page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => update("page", String(page - 1))}>Previous</Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => update("page", String(page + 1))}>Next</Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
