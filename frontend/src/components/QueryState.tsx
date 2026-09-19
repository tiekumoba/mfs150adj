export function QueryState({ loading, error }: { loading: boolean; error?: string }) {
  if (error) {
    return <p role="alert" className="p-5 text-sm text-destructive">Could not load data: {error}</p>;
  }
  if (loading) return <p className="p-5 text-sm text-muted-foreground">Loading…</p>;
  return null;
}
