import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./hooks/useAuth";
import { BoardPage } from "./pages/BoardPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { PublicProjectPage } from "./pages/PublicProjectPage";
import { RegisterPage } from "./pages/RegisterPage";

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
  tab: "board" | "decks" | "members" | "timeline" | "activity";
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

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/:userCode/:projectSlug" element={<PublicProjectPage />} />
        <Route path="/" element={<ProtectedProjectsPage />} />
        <Route path="/board" element={<ProtectedWorkspacePage tab="board" />} />
        <Route path="/decks" element={<ProtectedWorkspacePage tab="decks" />} />
        <Route path="/members" element={<ProtectedWorkspacePage tab="members" />} />
        <Route path="/timeline" element={<ProtectedWorkspacePage tab="timeline" />} />
        <Route path="/activity" element={<ProtectedWorkspacePage tab="activity" />} />
        <Route path="/profile" element={<ProtectedProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
};
