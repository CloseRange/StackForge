import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./hooks/useAuth";
import { BoardPage } from "./pages/BoardPage";
import { LoginPage } from "./pages/LoginPage";
import { ProjectsPage } from "./pages/ProjectsPage";
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

const ProtectedWorkspacePage = ({ tab }: { tab: "board" | "decks" | "activity" }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-300">Loading StackForge...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <BoardPage tab={tab} />;
};

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedProjectsPage />} />
        <Route path="/board" element={<ProtectedWorkspacePage tab="board" />} />
        <Route path="/decks" element={<ProtectedWorkspacePage tab="decks" />} />
        <Route path="/activity" element={<ProtectedWorkspacePage tab="activity" />} />
      </Routes>
    </BrowserRouter>
  );
};
