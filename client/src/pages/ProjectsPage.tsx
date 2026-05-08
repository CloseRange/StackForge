import { useEffect, useRef, useState } from "react";
import { Globe, Layers3, Link2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Header } from "../components/header/Header";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { useBoardStore } from "../hooks/useBoardStore";
import { DashboardLayout } from "../layouts/DashboardLayout";

export const ProjectsPage = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const {
    projects,
    selectedProjectId,
    isLoadingProjects,
    error,
    selectProject,
    clearError,
    loadProjects,
    createProject,
    updateProject,
    loadCards,
    loadDecks
  } = useBoardStore();

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyPublicLink = (project: { id: string; slug: string }) => {
    const code = user?.userCode;
    const url = code
      ? `${window.location.origin}/${code}/${project.slug}`
      : `${window.location.origin}/p/${project.id}`;
    void navigator.clipboard.writeText(url);
    setCopiedId(project.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTogglePublic = async (projectId: string, currentValue: boolean) => {
    if (!token) {
      return;
    }

    await updateProject(token, projectId, { isPublic: !currentValue });
  };

  const createFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadProjects(token);
  }, [loadProjects, token]);

  const handleCreateProject = async () => {
    if (!token || !projectName.trim()) {
      return;
    }

    setIsCreatingProject(true);

    try {
      const project = await createProject(token, {
        name: projectName,
        description: projectDescription
      });

      setProjectName("");
      setProjectDescription("");
      selectProject(project.id);
      await Promise.all([loadCards(token, project.id), loadDecks(token, project.id)]);
      navigate("/board");
    } finally {
      setIsCreatingProject(false);
    }
  };

  const openProjectRoute = async (projectId: string, route: "/board" | "/decks" | "/activity") => {
    if (!token) {
      return;
    }

    selectProject(projectId);
    await Promise.all([loadCards(token, projectId), loadDecks(token, projectId)]);
    navigate(route);
  };

  const sidebar = (
    <div className="flex h-full flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.38em] text-sky-300">Campaigns</p>
        <h2 className="mt-3 font-display text-2xl font-semibold text-white">Projects as campaigns</h2>
        <p className="mt-2 text-sm text-slate-400">
          Create campaigns, then jump into board, decks, or activity pages.
        </p>
      </div>

      <div ref={createFormRef} className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Plus className="h-4 w-4 text-sky-300" />
          New Campaign
        </div>
        <div className="space-y-3">
          <input
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="StackForge Launch"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
          />
          <textarea
            value={projectDescription}
            onChange={(event) => setProjectDescription(event.target.value)}
            placeholder="What are we shipping in this campaign?"
            rows={3}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
          />
          <Button
            className="w-full"
            onClick={() => void handleCreateProject()}
            disabled={isCreatingProject || !projectName.trim()}
          >
            {isCreatingProject ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Header
        variant="dashboard"
        onNewProject={() => {
          createFormRef.current?.scrollIntoView({ behavior: "smooth" });
          (createFormRef.current?.querySelector("input") as HTMLInputElement | null)?.focus();
        }}
      />

      <DashboardLayout sidebar={sidebar}>
        {error ? (
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <span>{error}</span>
            <Button variant="ghost" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        ) : null}

        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Layers3 className="h-4 w-4 text-amber-300" />
          All Campaigns
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`rounded-2xl border p-4 ${
                selectedProjectId === project.id ? "border-sky-300/35 bg-sky-500/10" : "border-white/10 bg-white/[0.06]"
              }`}
            >
              <h3 className="text-lg font-semibold text-white">{project.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{project.description || "No campaign brief yet."}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.08em] text-slate-400">{project.cardCount} cards</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => void openProjectRoute(project.id, "/board")}>Board</Button>
                <Button variant="outline" onClick={() => void openProjectRoute(project.id, "/decks")}>Decks</Button>
                <Button variant="ghost" onClick={() => void openProjectRoute(project.id, "/activity")}>Activity</Button>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                <button
                  type="button"
                  onClick={() => void handleTogglePublic(project.id, project.isPublic)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                    project.isPublic
                      ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  {project.isPublic ? "Public" : "Private"}
                </button>

                {project.isPublic ? (
                  <button
                    type="button"
                    onClick={() => copyPublicLink(project)}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-sky-300"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    {copiedId === project.id ? "Copied!" : "Copy Link"}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {!isLoadingProjects && projects.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-800/30 px-4 py-6 text-sm text-slate-400">
            No campaigns yet. Create one from the left panel.
          </div>
        ) : null}
      </DashboardLayout>
    </>
  );
};
