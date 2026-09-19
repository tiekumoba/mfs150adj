import { Menu } from "lucide-react";
import { UserButton } from "@clerk/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/lib/auth";

export function Header({ roleLabel, onMenuClick }: { roleLabel: string; onMenuClick: () => void }) {
  const auth = useAuthState();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Open menu">
        <Menu />
      </Button>
      <Badge variant="secondary">{roleLabel}</Badge>
      <div className="ml-auto flex items-center gap-3">
        {auth.status === "ready" && (
          <span className="hidden text-sm text-muted-foreground sm:inline">{auth.user.fullName}</span>
        )}
        <UserButton />
      </div>
    </header>
  );
}
