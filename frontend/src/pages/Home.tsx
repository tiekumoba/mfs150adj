import { Link } from "react-router-dom";
import { Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center p-6">
      <div className="mb-6 flex items-center gap-2 text-primary">
        <Award className="size-6" />
        <span className="text-lg font-semibold">Awards Adjudication System</span>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Foundation preview. Choose a view to explore the mock dashboards.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild><Link to="/login">Sign in</Link></Button>
          <Button variant="outline" asChild><Link to="/admin">Admin dashboard</Link></Button>
          <Button variant="outline" asChild><Link to="/adjudicator">Adjudicator dashboard</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
