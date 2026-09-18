import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { MAX_SCORE, MIN_SCORE } from "@awards/shared";
import { MockDataNotice, PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { mockAssignments, mockCriteria } from "@/mocks/data";

export default function EvaluationPage() {
  const { assignmentId } = useParams();
  // MOCK: replace with a query for the assignment (nomination, category, criteria, existing draft)
  const assignment = mockAssignments.find((a) => a.id === assignmentId) ?? mockAssignments[0];

  const [scores, setScores] = useState<Record<string, string>>({});
  const [comments, setComments] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const isValid = (value: string | undefined) => {
    const n = Number(value);
    return value !== undefined && value !== "" && Number.isInteger(n) && n >= MIN_SCORE && n <= MAX_SCORE;
  };

  function saveDraft() {
    // MOCK: nothing is persisted. Replace with a call to the evaluations API (status DRAFT).
    setMessage({ tone: "ok", text: "Draft saved (mock — not persisted)." });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const missing = mockCriteria.filter((c) => !isValid(scores[c.id]));
    if (missing.length > 0) {
      setMessage({
        tone: "error",
        text: `Enter a whole-number score from ${MIN_SCORE} to ${MAX_SCORE} for: ${missing.map((c) => c.name).join(", ")}.`,
      });
      return;
    }
    // MOCK: nothing is persisted. Replace with a call to the evaluations API (status SUBMITTED).
    setMessage({ tone: "ok", text: "Evaluation submitted (mock — not persisted)." });
  }

  if (!assignment) return null;

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
        <Link to="/adjudicator"><ArrowLeft /> Back to assignments</Link>
      </Button>
      <PageHeader title="Evaluation" />
      <MockDataNotice />
      <form onSubmit={submit} noValidate className="space-y-6">
        <Card>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Nominee</p>
              <p className="mt-1 font-medium">{assignment.nominee}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Award Category</p>
              <p className="mt-1 font-medium">{assignment.category}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockCriteria.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-4">
                <Label htmlFor={c.id}>{c.name}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={c.id}
                    type="number"
                    inputMode="numeric"
                    min={MIN_SCORE}
                    max={MAX_SCORE}
                    step={1}
                    placeholder={`${MIN_SCORE}–${MAX_SCORE}`}
                    className="w-24"
                    value={scores[c.id] ?? ""}
                    onChange={(e) => setScores((s) => ({ ...s, [c.id]: e.target.value }))}
                  />
                  <span className="text-sm text-muted-foreground">/ {MAX_SCORE}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              aria-label="Comments"
              placeholder="Add any supporting comments about this nominee…"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </CardContent>
        </Card>

        {message && (
          <p role="status" className={message.tone === "error" ? "text-sm text-destructive" : "text-sm text-emerald-700"}>
            {message.text}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={saveDraft}>Save Draft</Button>
          <Button type="submit">Submit Evaluation</Button>
        </div>
      </form>
    </>
  );
}
