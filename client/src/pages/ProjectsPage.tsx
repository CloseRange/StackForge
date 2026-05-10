import { useEffect, useRef, useState } from "react";
import { Globe, Layers3, Link2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Header } from "../components/header/Header";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { useBoardStore } from "../hooks/useBoardStore";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { resolveProjectIconUrl } from "../utils/projectIcons";

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

  return (
    <>
      <Header
        variant="dashboard"
        onNewProject={() => {
          createFormRef.current?.scrollIntoView({ behavior: "smooth" });
          (createFormRef.current?.querySelector("input") as HTMLInputElement | null)?.focus();
        }}
      />

      <DashboardLayout sidebar={
        <div className="flex h-full flex-col gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.38em] text-sky-300">Campaigns</p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-white">Projects as campaigns</h2>
            <p className="mt-2 text-sm text-slate-400">
              Create campaigns, then deal cards into the board and push them to victory.
            </p>
          </div>
          <div ref={createFormRef} className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4">
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
          <div className="flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Layers3 className="h-4 w-4 text-amber-300" />
              Active Campaigns
            </div>
            <div className="space-y-2 overflow-y-auto pr-1">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => selectProject(project.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    project.id === selectedProjectId
                      ? "border-sky-300/40 bg-sky-400/10"
                      : "border-white/8 bg-slate-950/40 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="font-semibold text-white">{project.name}</div>
                  <div className="mt-1 text-sm text-slate-400">
                    {project.description || "No campaign brief yet."}
                  </div>
                </button>
              ))}
              {!isLoadingProjects && projects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-6 text-sm text-slate-500">
                  No campaigns yet. Create one to unlock the board.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      }>
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
          {projects.map((project) => {
            const projectIconUrl = resolveProjectIconUrl(project.icon);

            return (
              <button
                key={project.id}
                type="button"
                onClick={() => void openProjectRoute(project.id, "/board")}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:border-sky-300/40 hover:bg-sky-500/10 hover:shadow-lg"
              >
                {projectIconUrl ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-2 top-1/2 h-40 w-40 -translate-y-1/2 opacity-[0.12]"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.95)",
                      WebkitMaskImage: `url(${projectIconUrl})`,
                      maskImage: `url(${projectIconUrl})`,
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                      WebkitMaskSize: "contain",
                      maskSize: "contain"
                    }}
                  />
                ) : null}

                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{project.description || "No campaign brief yet."}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.08em] text-slate-400">{project.cardCount} cards</p>

                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleTogglePublic(project.id, project.isPublic);
                      }}
                      className={`btn-motion btn-shimmer flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
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
                        onClick={(e) => {
                          e.stopPropagation();
                          copyPublicLink(project);
                        }}
                        className="btn-motion btn-shimmer flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-sky-300"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        {copiedId === project.id ? "Copied!" : "Copy Link"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {!isLoadingProjects && projects.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-800/30 px-4 py-6 text-sm text-slate-400">
            No campaigns yet. Create one with the form above.
          </div>
        ) : null}
      </DashboardLayout>
    </>
  );
};
