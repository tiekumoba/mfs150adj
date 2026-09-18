import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RequireRole } from "@/lib/auth";
import { adjudicatorNav, adminNav } from "@/lib/nav";
import AdjudicatorDashboard from "@/pages/AdjudicatorDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminSection from "@/pages/AdminSection";
import EvaluationPage from "@/pages/EvaluationPage";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <RequireRole roles={["ADMIN"]}>
              <AppShell nav={adminNav} roleLabel="Admin" />
            </RequireRole>
          }
        >
          <Route index element={<AdminDashboard />} />
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
    </BrowserRouter>
  );
}
