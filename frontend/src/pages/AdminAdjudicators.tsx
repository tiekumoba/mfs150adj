import { useState, type FormEvent } from "react";
import { useAuth } from "@clerk/react";
import type { AdjudicatorDto } from "@awards/shared";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { useApiQuery } from "@/lib/useApiQuery";

function StatusBadge({ a }: { a: AdjudicatorDto }) {
  if (!a.isActive) return <Badge variant="secondary">Deactivated</Badge>;
  if (!a.hasSignedIn) return <Badge variant="warning">Invited</Badge>;
  return <Badge variant="success">Active</Badge>;
}

export default function AdminAdjudicators() {
  const { getToken } = useAuth();
  const [reload, setReload] = useState(0);
  const { data, loading, error } = useApiQuery<{ data: AdjudicatorDto[] }>("/api/adjudicators", reload);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await apiFetch("/api/adjudicators", await getToken(), { method: "POST", body: { email: email.trim(), fullName } });
      setMessage({
        tone: "ok",
        text: `${fullName.trim()} was added. They can sign in once you invite ${email.trim()} in Clerk.`,
      });
      setFullName("");
      setEmail("");
      setReload((n) => n + 1);
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof Error ? err.message : "Could not add adjudicator" });
    } finally {
      setBusy(false);
    }
  }

  async function setActive(a: AdjudicatorDto, isActive: boolean) {
    setMessage(null);
    try {
      await apiFetch(`/api/adjudicators/${a.id}`, await getToken(), { method: "PATCH", body: { isActive } });
      setReload((n) => n + 1);
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof Error ? err.message : "Could not update adjudicator" });
    }
  }

  return (
    <>
      <PageHeader title="Adjudicators" description="People who can review and score nominations. Access is by invitation only." />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add adjudicator</CardTitle>
          <CardDescription>
            Use the email address they will sign in with. After adding them here, invite the same email in the
            Clerk dashboard so they can create their password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="adj-name">Full name</Label>
              <Input id="adj-name" required maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="adj-email">Email</Label>
              <Input id="adj-email" type="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" disabled={busy}>{busy ? "Adding…" : "Add adjudicator"}</Button>
          </form>
          {message && (
            <p role="status" className={`mt-3 text-sm ${message.tone === "error" ? "text-destructive" : "text-emerald-700"}`}>
              {message.text}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <QueryState loading={loading} error={error} />
        {data && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignments</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No adjudicators yet.</TableCell>
                </TableRow>
              )}
              {data.data.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.fullName}</TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell><StatusBadge a={a} /></TableCell>
                  <TableCell>{a.assignmentCount}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setActive(a, !a.isActive)}>
                      {a.isActive ? "Deactivate" : "Reactivate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
