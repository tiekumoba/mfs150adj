import type { ReactNode } from "react";

export function AccessDenied({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div className="denied">
      <h1>Access denied</h1>
      <p>{message}</p>
      {children}
    </div>
  );
}
