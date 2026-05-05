import { useEffect, useRef, useState } from "react";
import { Layers3, Plus } from "lucide-react";

import { BoardView } from "../components/board/BoardView";
import { CardEditorModal } from "../components/cards/CardEditorModal";
import { Header } from "../components/header/Header";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { useBoardStore } from "../hooks/useBoardStore";
import { DashboardLayout } from "../layouts/DashboardLayout";
import type { Card, CardStatus } from "../types/api";

export const BoardPage = () => {
  const { token, user } = useAuth();
  const {
    projects,
    cards,
    selectedProjectId,
    isLoadingProjects,
    isLoadingCards,
    error,
    selectProject,
    clearError,
    loadProjects,
    createProject,
    loadCards,
    createCard,
    updateCard,
    moveCard
  } = useBoardStore();
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [draftStatus, setDraftStatus] = useState<CardStatus>("deck");
  const createFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadProjects(token);
  }, [loadProjects, token]);

  useEffect(() => {
    if (!token || !selectedProjectId) {
      return;
    }

    void loadCards(token, selectedProjectId);
  }, [loadCards, selectedProjectId, token]);

  const activeProject = projects.find((project) => project.id === selectedProjectId) ?? null;

  const openNewCard = (status: CardStatus) => {
    setDraftStatus(status);
    setEditingCard(null);
    setIsEditorOpen(true);
  };

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
      await loadCards(token, project.id);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const sidebar = (
    <div className="flex h-full flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.38em] text-sky-300">Campaigns</p>
        <h2 className="mt-3 font-display text-2xl font-semibold text-white">Projects as campaigns</h2>
        <p className="mt-2 text-sm text-slate-400">Create campaigns, then deal cards into the board and push them to victory.</p>
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
          <Button className="w-full" onClick={() => void handleCreateProject()} disabled={isCreatingProject || !projectName.trim()}>
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
              <div className="mt-1 text-sm text-slate-400">{project.description || "No campaign brief yet."}</div>
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
  );

  const totalXp = cards.reduce((sum, c) => sum + (c.xpValue ?? 0), 0);

  return (
    <>
      {activeProject ? (
        <Header
          variant="project"
          projectName={activeProject.name}
          xp={totalXp}
          xpMax={Math.max(totalXp + 500, 2000)}
        />
      ) : (
        <Header
          variant="dashboard"
          onNewProject={() => {
            createFormRef.current?.scrollIntoView({ behavior: "smooth" });
            (createFormRef.current?.querySelector("input") as HTMLInputElement | null)?.focus();
          }}
        />
      )}
      <DashboardLayout sidebar={sidebar}>
        {error ? (
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <span>{error}</span>
            <Button variant="ghost" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        ) : null}
        {activeProject ? (
          <>
            <BoardView
              cards={cards}
              onMoveCard={async (cardId, status) => {
                if (!token) {
                  return;
                }
                await moveCard(token, cardId, status);
              }}
              onCreateCard={openNewCard}
              onSelectCard={(card) => {
                setEditingCard(card);
                setDraftStatus(card.status);
                setIsEditorOpen(true);
              }}
            />
            <CardEditorModal
              isOpen={isEditorOpen}
              projectId={activeProject.id}
              currentUserId={user!.id}
              defaultStatus={draftStatus}
              card={editingCard}
              onClose={() => setIsEditorOpen(false)}
              onCreate={async (payload) => {
                if (!token) {
                  return;
                }
                await createCard(token, payload);
              }}
              onUpdate={async (cardId, payload) => {
                if (!token) {
                  return;
                }
                await updateCard(token, cardId, payload);
              }}
            />
          </>
        ) : (
          <div className="flex min-h-[28rem] items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-slate-950/30 text-center">
            <div>
              <h2 className="font-display text-2xl font-semibold text-white">Your board is waiting</h2>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Create a campaign in the sidebar, then add cards and drag them from deck to victory.
              </p>
            </div>
          </div>
        )}
        {isLoadingCards && activeProject ? <p className="mt-4 text-sm text-slate-500">Loading cards...</p> : null}
      </DashboardLayout>
    </>
  );
};
