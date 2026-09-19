import { Link, Navigate } from "react-router-dom";
import { Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingScreen, roleHome, useAuthState } from "@/lib/auth";

export default function Home() {
  const auth = useAuthState();
  if (auth.status === "loading") return <LoadingScreen />;
  if (auth.status === "ready") return <Navigate to={roleHome(auth.user.role)} replace />;
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center p-6">
      <div className="mb-6 flex items-center gap-2 text-primary">
        <Award className="size-6" />
        <span className="text-lg font-semibold">Awards Adjudication System</span>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Sign in to review nominations and manage evaluations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild><Link to="/login">Sign in</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
