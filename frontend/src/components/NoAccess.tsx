import { SignOutButton } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function NoAccess({ message }: { message?: string }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <Card>
        <CardHeader>
          <CardTitle>No access</CardTitle>
          <CardDescription>
            {message ?? "Your account has not been granted access to this system. Contact an administrator."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutButton>
            <Button variant="outline">Sign out</Button>
          </SignOutButton>
        </CardContent>
      </Card>
    </div>
  );
}
