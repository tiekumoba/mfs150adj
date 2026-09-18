import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Header({ roleLabel, onMenuClick }: { roleLabel: string; onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Open menu">
        <Menu />
      </Button>
      <Badge variant="secondary">{roleLabel}</Badge>
      <div className="ml-auto flex items-center gap-3">
        {/* MOCK: replace with the signed-in Clerk user */}
        <span className="hidden text-sm text-muted-foreground sm:inline">Demo User</span>
        <Button variant="outline" size="sm" asChild>
          <Link to="/login">Sign out</Link>
        </Button>
      </div>
    </header>
  );
}
