import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { NominationDetail } from "@awards/shared";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { safeHref } from "@/lib/format";
import { useApiQuery } from "@/lib/useApiQuery";

const kindLabel = { image: "Image", document: "Document", video: "Video", external_link: "Link" } as const;

export default function AdminNominationDetail() {
  const { id } = useParams();
  const { data, loading, error } = useApiQuery<{ data: NominationDetail }>(id ? `/api/nominations/${id}` : null);
  const n = data?.data;

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
        <Link to="/admin/nominations"><ArrowLeft /> Back to nominations</Link>
      </Button>
      <QueryState loading={loading} error={error} />
      {n && (
        <div className="space-y-6">
          <PageHeader title={n.nomineeName} description={n.categoryName} />
          <Card>
            <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Award Category</p>
                <p className="mt-1 font-medium">{n.categoryName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Nominated by</p>
                <p className="mt-1 font-medium">{n.nominatorName ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Justification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{n.citation ?? "No justification provided."}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Supporting evidence ({n.documents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {n.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No supporting evidence was submitted.</p>
              ) : (
                <ul className="divide-y">
                  {n.documents.map((d) => {
                    const href = safeHref(d.url);
                    return (
                      <li key={d.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                          <Badge variant="secondary">{kindLabel[d.kind]}</Badge>
                          <span className="truncate">{d.fileName ?? d.url}</span>
                        </span>
                        {href && (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-1 text-primary hover:underline"
                          >
                            Open <ExternalLink className="size-3.5" />
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
