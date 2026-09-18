import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Authentication is not connected yet. The Clerk sign-in component will be mounted here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* TODO(clerk): replace with <SignIn /> */}
          <Button asChild><Link to="/admin">Continue as Admin (demo)</Link></Button>
          <Button variant="outline" asChild><Link to="/adjudicator">Continue as Adjudicator (demo)</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
