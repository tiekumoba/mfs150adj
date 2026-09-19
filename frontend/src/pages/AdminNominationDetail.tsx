import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { ArrowLeft, ExternalLink, Pencil, Trash2 } from "lucide-react";
import type {
  AuditEntryDto,
  CategoryDto,
  EvidenceKind,
  NominationDetail,
  NominationUpdate,
} from "@awards/shared";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { safeHref } from "@/lib/format";
import { useApiQuery } from "@/lib/useApiQuery";

const kindLabel: Record<EvidenceKind, string> = {
  image: "Image",
  document: "Document",
  video: "Video",
  external_link: "Link",
};

const fieldLabel: Record<string, string> = {
  nomineeName: "Nominee name",
  nominatorName: "Nominated by",
  citation: "Justification",
  category: "Award category",
  evidence: "Supporting evidence",
};

const actionLabel: Record<string, string> = {
  "nomination.updated": "Edited details",
  "nomination.evidence_added": "Added evidence",
  "nomination.evidence_removed": "Removed evidence",
};

const selectClass = "h-9 w-full rounded-md border border-input bg-card px-3 text-sm";

type Message = { tone: "ok" | "error"; text: string };

export default function AdminNominationDetailPage() {
  const { id } = useParams();
  // Keyed by id so edit state never leaks between nominations.
  return id ? <NominationDetailView key={id} id={id} /> : null;
}

function NominationDetailView({ id }: { id: string }) {
  const { getToken } = useAuth();
  const { data, loading, error } = useApiQuery<{ data: NominationDetail }>(`/api/nominations/${id}`);
  const categories = useApiQuery<{ data: CategoryDto[] }>("/api/categories");
  const [updated, setUpdated] = useState<NominationDetail | null>(null);
  const [historyToken, setHistoryToken] = useState(0);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const n = updated ?? data?.data;

  /** Sends a change, shows the returned nomination and refreshes the history. */
  async function send(path: string, init: { method: string; body?: unknown }, okText: string): Promise<boolean> {
    setMessage(null);
    try {
      const res = await apiFetch<{ data: NominationDetail }>(path, await getToken(), init);
      setUpdated(res.data);
      setHistoryToken((t) => t + 1);
      setMessage({ tone: "ok", text: okText });
      return true;
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof Error ? err.message : "Request failed" });
      return false;
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
        <Link to="/admin/nominations"><ArrowLeft /> Back to nominations</Link>
      </Button>
      <QueryState loading={loading && !n} error={error} />
      {n && (
        <div className="space-y-6">
          <PageHeader
            title={n.nomineeName}
            description={n.categoryName}
            actions={
              !editing && (
                <Button variant="outline" onClick={() => { setMessage(null); setEditing(true); }}>
                  <Pencil /> Edit
                </Button>
              )
            }
          />
          {message && (
            <p role="status" className={`text-sm ${message.tone === "error" ? "text-destructive" : "text-emerald-700"}`}>
              {message.text}
            </p>
          )}

          {editing ? (
            <EditForm
              nomination={n}
              categories={categories.data?.data ?? []}
              onCancel={() => setEditing(false)}
              onSave={async (changes) => {
                const ok = await send(`/api/nominations/${id}`, { method: "PATCH", body: changes }, "Changes saved.");
                if (ok) setEditing(false);
              }}
            />
          ) : (
            <>
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
            </>
          )}

          <EvidenceCard
            nomination={n}
            onAdd={(body) => send(`/api/nominations/${id}/documents`, { method: "POST", body }, "Evidence added.")}
            onRemove={(docId, reason) =>
              send(`/api/nominations/${id}/documents/${docId}`, { method: "DELETE", body: { reason } }, "Evidence removed.")
            }
          />
          <HistoryCard id={id} reloadToken={historyToken} />
        </div>
      )}
    </>
  );
}

function EditForm({
  nomination: n,
  categories,
  onSave,
  onCancel,
}: {
  nomination: NominationDetail;
  categories: CategoryDto[];
  onSave: (changes: NominationUpdate & { reason: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [nomineeName, setNomineeName] = useState(n.nomineeName);
  const [nominatorName, setNominatorName] = useState(n.nominatorName ?? "");
  const [categoryId, setCategoryId] = useState(n.categoryId);
  const [citation, setCitation] = useState(n.citation ?? "");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    await onSave({ nomineeName, nominatorName, categoryId, citation, reason: reason.trim() });
    setBusy(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit nomination</CardTitle>
      </CardHeader>
      <CardContent>
        {n.evaluationCount > 0 && (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {n.evaluationCount} evaluation{n.evaluationCount === 1 ? "" : "s"} already exist for this nomination.
            Changes you make here will affect what adjudicators have already reviewed.
          </p>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nominee">Nominee name</Label>
            <Input id="nominee" required maxLength={200} value={nomineeName} onChange={(e) => setNomineeName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nominator">Nominated by</Label>
            <Input id="nominator" maxLength={200} value={nominatorName} onChange={(e) => setNominatorName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Award category</Label>
            <select id="category" className={selectClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.length === 0 && <option value={n.categoryId}>{n.categoryName}</option>}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="citation">Justification</Label>
            <Textarea id="citation" className="min-h-40" maxLength={20000} value={citation} onChange={(e) => setCitation(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason for change (required)</Label>
            <Textarea
              id="reason"
              required
              minLength={3}
              maxLength={500}
              className="min-h-20"
              placeholder="Why are you making this change? This is saved in the change history."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function EvidenceCard({
  nomination: n,
  onAdd,
  onRemove,
}: {
  nomination: NominationDetail;
  onAdd: (body: { kind: EvidenceKind; url: string; fileName: string; reason: string }) => Promise<boolean>;
  onRemove: (documentId: string, reason: string) => Promise<boolean>;
}) {
  const [kind, setKind] = useState<EvidenceKind>("document");
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [addReason, setAddReason] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeReason, setRemoveReason] = useState("");

  async function add(e: FormEvent) {
    e.preventDefault();
    if (await onAdd({ kind, url: url.trim(), fileName, reason: addReason.trim() })) {
      setUrl("");
      setFileName("");
      setAddReason("");
    }
  }

  async function remove(e: FormEvent, documentId: string) {
    e.preventDefault();
    if (await onRemove(documentId, removeReason.trim())) {
      setRemovingId(null);
      setRemoveReason("");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supporting evidence ({n.documents.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {n.documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No supporting evidence was submitted.</p>
        ) : (
          <ul className="divide-y">
            {n.documents.map((d) => {
              const href = safeHref(d.url);
              return (
                <li key={d.id} className="py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <Badge variant="secondary">{kindLabel[d.kind]}</Badge>
                    <span className="truncate">{d.fileName ?? d.url}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    {href && (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        Open <ExternalLink className="size-3.5" />
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${d.fileName ?? d.url}`}
                      onClick={() => {
                        setRemovingId(d.id);
                        setRemoveReason("");
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </span>
                  </div>
                  {removingId === d.id && (
                    <form onSubmit={(e) => remove(e, d.id)} className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="flex-1 space-y-1.5">
                        <Label htmlFor={`rm-${d.id}`}>Reason for removing (required)</Label>
                        <Input id={`rm-${d.id}`} required minLength={3} maxLength={500} value={removeReason} onChange={(e) => setRemoveReason(e.target.value)} />
                      </div>
                      <Button type="submit" variant="destructive">Remove</Button>
                      <Button type="button" variant="outline" onClick={() => setRemovingId(null)}>Cancel</Button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <form onSubmit={add} className="grid gap-3 border-t pt-4 sm:grid-cols-[9rem_1fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="ev-kind">Type</Label>
            <select id="ev-kind" className={selectClass} value={kind} onChange={(e) => setKind(e.target.value as EvidenceKind)}>
              {(Object.keys(kindLabel) as EvidenceKind[]).map((k) => (
                <option key={k} value={k}>{kindLabel[k]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-url">Link (https://…)</Label>
            <Input id="ev-url" type="url" required maxLength={2000} value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-name">File name (optional)</Label>
            <Input id="ev-name" maxLength={255} value={fileName} onChange={(e) => setFileName(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-4">
            <Label htmlFor="ev-reason">Reason for adding (required)</Label>
            <Input id="ev-reason" required minLength={3} maxLength={500} value={addReason} onChange={(e) => setAddReason(e.target.value)} />
          </div>
          <Button type="submit" variant="outline" className="sm:col-span-4 sm:justify-self-start">Add evidence</Button>
        </form>
      </CardContent>
    </Card>
  );
}

const clip = (v: string | null) => (v === null ? "(empty)" : v.length > 160 ? `${v.slice(0, 160)}…` : v);

function HistoryCard({ id, reloadToken }: { id: string; reloadToken: number }) {
  const { data, loading, error } = useApiQuery<{ data: AuditEntryDto[] }>(`/api/nominations/${id}/history`, reloadToken);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Change history</CardTitle>
      </CardHeader>
      <CardContent>
        <QueryState loading={loading && !data} error={error} />
        {data && data.data.length === 0 && (
          <p className="text-sm text-muted-foreground">No changes have been made to this nomination.</p>
        )}
        {data && data.data.length > 0 && (
          <ol className="space-y-4">
            {data.data.map((e) => (
              <li key={e.id} className="border-l-2 pl-4 text-sm">
                <p className="font-medium">{actionLabel[e.action] ?? e.action}</p>
                <p className="text-muted-foreground">
                  {new Date(e.createdAt).toLocaleString("en-GB")} · by {e.actorName ?? e.actorEmail ?? "unknown"}
                  {e.actorName && e.actorEmail ? ` (${e.actorEmail})` : ""} · via {e.source === "web" ? "web app" : e.source}
                  {e.ipAddress ? ` · IP ${e.ipAddress}` : ""}
                </p>
                <p className="mt-1">
                  <span className="text-muted-foreground">Reason:</span>{" "}
                  {e.reason ?? <span className="italic text-muted-foreground">No reason recorded</span>}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {e.changes.map((c, i) => (
                    <li key={i}>
                      <span className="text-muted-foreground">{fieldLabel[c.field] ?? c.field}:</span>{" "}
                      <span className="line-through decoration-muted-foreground/60">{clip(c.from)}</span>
                      {" → "}
                      <span>{clip(c.to)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
