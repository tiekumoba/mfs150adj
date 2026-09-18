import { Navigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { adminNav } from "@/lib/nav";

/** Placeholder for admin sections that are not built yet. */
export default function AdminSection() {
  const { section } = useParams();
  const item = adminNav.find((n) => n.to === `/admin/${section}`);
  if (!item) return <Navigate to="/admin" replace />;
  return (
    <>
      <PageHeader title={item.label} />
      <Card>
        <CardContent className="p-8 pt-8 text-center text-sm text-muted-foreground">
          The {item.label} section is not built yet.
        </CardContent>
      </Card>
    </>
  );
}
