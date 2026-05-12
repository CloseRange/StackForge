import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";

import { SiteFooter } from "./components/footer/SiteFooter";
import { useAuth } from "./hooks/useAuth";
import { BoardPage } from "./pages/BoardPage";
import { DemoProjectPage } from "./pages/DemoProjectPage";
import { DocumentationPage } from "./pages/DocumentationPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { PublicProjectPage } from "./pages/PublicProjectPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ReportBugPage } from "./pages/ReportBugPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TermsPage } from "./pages/TermsPage";

const HomePage = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-300">Loading StackForge...</div>;
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <ProjectsPage />;
};

const ProtectedProjectsPage = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-300">Loading StackForge...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <ProjectsPage />;
};

const ProtectedWorkspacePage = ({
  tab
}: {
  tab: "board" | "decks" | "members" | "timeline" | "activity" | "settings";
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-300">Loading StackForge...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <BoardPage tab={tab} />;
};

const ProtectedProfilePage = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-300">Loading StackForge...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <ProfilePage />;
};

const ProtectedSettingsPage = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-300">Loading StackForge...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <SettingsPage />;
};

const FOOTER_HIDDEN_PATHS = [
  "/board",
  "/decks",
  "/members",
  "/timeline",
  "/activity",
  "/settings",
  "/profile",
  "/account/settings"
] as const;

const AppRoutes = () => {
  const location = useLocation();
  const showFooter = !FOOTER_HIDDEN_PATHS.some(
    (path) => location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/demo" element={<DemoProjectPage />} />
        <Route path="/features" element={<LandingPage initialSection="features" />} />
        <Route path="/documentation" element={<DocumentationPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/report-a-bug" element={<ReportBugPage />} />
        <Route path="/:userCode/:projectSlug" element={<PublicProjectPage />} />
        <Route path="/board" element={<ProtectedWorkspacePage tab="board" />} />
        <Route path="/decks" element={<ProtectedWorkspacePage tab="decks" />} />
        <Route path="/decks/:deckId" element={<ProtectedWorkspacePage tab="decks" />} />
        <Route path="/members" element={<ProtectedWorkspacePage tab="members" />} />
        <Route path="/timeline" element={<ProtectedWorkspacePage tab="timeline" />} />
        <Route path="/activity" element={<ProtectedWorkspacePage tab="activity" />} />
        <Route path="/settings" element={<ProtectedWorkspacePage tab="settings" />} />
        <Route path="/profile" element={<ProtectedProfilePage />} />
        <Route path="/account/settings" element={<ProtectedSettingsPage />} />
      </Routes>
      {showFooter ? <SiteFooter /> : null}
    </>
  );
};

export const App = () => {
  return (
    <BrowserRouter basename="/projects/stackforge">
      <AppRoutes />
    </BrowserRouter>
  );
};
