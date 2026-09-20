import { Route, Routes } from "react-router-dom";
import { CurrentUserGate } from "../components/CurrentUserGate";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { RequireRole } from "../components/RequireRole";
import { AppLayout } from "../layouts/AppLayout";
import { AccessDeniedPage } from "../pages/AccessDeniedPage";
import { AdjudicatorDashboardPage } from "../pages/AdjudicatorDashboardPage";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { RoleHomePage } from "../pages/RoleHomePage";
import { SignInPage } from "../pages/SignInPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/sign-in/*" element={<SignInPage />} />
      {/* Signed in with Clerk, then required to have an active account in the app. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<CurrentUserGate />}>
          <Route element={<AppLayout />}>
            <Route index element={<RoleHomePage />} />
            <Route path="/dashboard" element={<RoleHomePage />} />
            <Route path="/access-denied" element={<AccessDeniedPage />} />
            <Route element={<RequireRole role="admin" />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
            </Route>
            <Route element={<RequireRole role="adjudicator" />}>
              <Route path="/adjudicator" element={<AdjudicatorDashboardPage />} />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
