import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider, RequireRole } from "@/lib/auth";
import { adjudicatorNav, adminNav } from "@/lib/nav";
import AdjudicatorDashboard from "@/pages/AdjudicatorDashboard";
import AdminCategories from "@/pages/AdminCategories";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminNominationDetail from "@/pages/AdminNominationDetail";
import AdminNominations from "@/pages/AdminNominations";
import AdminSection from "@/pages/AdminSection";
import EvaluationPage from "@/pages/EvaluationPage";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/** Clerk needs the router so its redirects stay client-side. */
function AuthRoot({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/login"
      signInFallbackRedirectUrl="/"
      afterSignOutUrl="/"
    >
      <AuthProvider>{children}</AuthProvider>
    </ClerkProvider>
  );
}

export default function App() {
  if (!publishableKey) {
    return (
      <p className="p-6 text-sm">
        Missing <code>VITE_CLERK_PUBLISHABLE_KEY</code>. Add it to <code>frontend/.env.local</code> (or the
        Vercel environment variables) and rebuild.
      </p>
    );
  }
  return (
    <BrowserRouter>
      <AuthRoot>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login/*" element={<Login />} />

          <Route
            path="/admin"
            element={
              <RequireRole roles={["ADMIN"]}>
                <AppShell nav={adminNav} roleLabel="Admin" />
              </RequireRole>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="nominations" element={<AdminNominations />} />
            <Route path="nominations/:id" element={<AdminNominationDetail />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path=":section" element={<AdminSection />} />
          </Route>

          <Route
            path="/adjudicator"
            element={
              <RequireRole roles={["ADJUDICATOR"]}>
                <AppShell nav={adjudicatorNav} roleLabel="Adjudicator" />
              </RequireRole>
            }
          >
            <Route index element={<AdjudicatorDashboard />} />
            <Route path="evaluations/:assignmentId" element={<EvaluationPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthRoot>
    </BrowserRouter>
  );
}
