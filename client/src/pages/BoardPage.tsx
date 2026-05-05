import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bug, Layers3, Plus, PlusCircle, Sparkles, Trophy } from "lucide-react";

import { BoardView } from "../components/board/BoardView";
import { CardEditorModal } from "../components/cards/CardEditorModal";
import { Header } from "../components/header/Header";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../hooks/useAuth";
import { useBoardStore } from "../hooks/useBoardStore";
import { DashboardLayout } from "../layouts/DashboardLayout";
import type { Card, CardStatus } from "../types/api";

type ProjectTab = "board" | "decks" | "activity";

type DeckColor = "teal" | "cyan" | "amber" | "rose" | "indigo";

type CustomDeck = {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: DeckColor;
};

type DeckCard = {
  id: string;
  label: string;
  description: string;
  icon: "debug" | "completed" | "custom";
  color: DeckColor | "debug" | "completed";
  colorClass: string;
};

const CUSTOM_DECK_PREFIX = "deck:";
const FIXED_DECK_IDS = ["debug", "completed"] as const;

const COLOR_OPTIONS: Array<{ value: DeckColor; label: string; className: string }> = [
  {
    value: "teal",
    label: "Teal",
    className: "border-teal-300/30 bg-teal-500/10 text-teal-100"
  },
  {
    value: "cyan",
    label: "Cyan",
    className: "border-cyan-300/30 bg-cyan-500/10 text-cyan-100"
  },
  {
    value: "amber",
    label: "Amber",
    className: "border-amber-300/30 bg-amber-500/10 text-amber-100"
  },
  {
    value: "rose",
    label: "Rose",
    className: "border-rose-300/30 bg-rose-500/10 text-rose-100"
  },
  {
    value: "indigo",
    label: "Indigo",
    className: "border-indigo-300/30 bg-indigo-500/10 text-indigo-100"
  }
];

const priorityMap = {
  low: "common",
  medium: "uncommon",
  high: "rare"
} as const;

const toDeckId = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const toDeckLabel = (id: string) => id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const getDeckColorClass = (color: DeckColor | "debug" | "completed") => {
  if (color === "debug") {
    return "border-rose-300/30 bg-rose-500/10 text-rose-100";
  }

  if (color === "completed") {
    return "border-emerald-300/30 bg-emerald-500/10 text-emerald-100";
  }

  const option = COLOR_OPTIONS.find((entry) => entry.value === color);
  return option?.className ?? "border-teal-300/30 bg-teal-500/10 text-teal-100";
};

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

  const [activeTab, setActiveTab] = useState<ProjectTab>("board");
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [isCreateDeckModalOpen, setIsCreateDeckModalOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDescription, setNewDeckDescription] = useState("");
  const [newDeckIcon, setNewDeckIcon] = useState("");
  const [newDeckColor, setNewDeckColor] = useState<DeckColor>("teal");
  const [customDecks, setCustomDecks] = useState<CustomDeck[]>([]);
  const [deckQuickTitle, setDeckQuickTitle] = useState("");
  const [deckQuickPriority, setDeckQuickPriority] = useState<"low" | "medium" | "high">("medium");
  const [isDeckQuickAdding, setIsDeckQuickAdding] = useState(false);
  const [isDeckQuickAddOpen, setIsDeckQuickAddOpen] = useState(false);

  const deckQuickTitleRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    setActiveTab("board");
    setActiveDeckId(null);
    setIsDeckQuickAddOpen(false);
    setDeckQuickTitle("");
    setDeckQuickPriority("medium");
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) {
      setCustomDecks([]);
      setActiveDeckId(null);
      return;
    }

    const storageKey = `stackforge-decks:${selectedProjectId}`;
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      setCustomDecks([]);
      setActiveDeckId(null);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as CustomDeck[];
      const sanitized = parsed
        .filter((deck) => deck.id && deck.label && !["bugs", "debug", "completed"].includes(deck.id))
        .map((deck) => ({
          id: deck.id,
          label: deck.label,
          description: deck.description ?? "",
          icon: deck.icon ?? "",
          color: deck.color ?? "teal"
        }));
      setCustomDecks(sanitized);
      setActiveDeckId(null);
    } catch {
      setCustomDecks([]);
      setActiveDeckId(null);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) {
      return;
    }

    const storageKey = `stackforge-decks:${selectedProjectId}`;
    localStorage.setItem(storageKey, JSON.stringify(customDecks));
  }, [customDecks, selectedProjectId]);

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

  const inferredCustomDecks = useMemo(() => {
    const ids = new Set<{ id: string; label: string }>();

    cards.forEach((card) => {
      card.tags.forEach((tag) => {
        if (tag.startsWith(CUSTOM_DECK_PREFIX)) {
          const id = tag.slice(CUSTOM_DECK_PREFIX.length).trim();
          if (id && !["bugs", "debug", "completed"].includes(id)) {
            ids.add({ id, label: toDeckLabel(id) });
          }
        }
      });
    });

    return Array.from(ids);
  }, [cards]);

  const allDecks = useMemo<DeckCard[]>(() => {
    const customMap = new Map<string, CustomDeck>();
    customDecks.forEach((deck) => customMap.set(deck.id, deck));
    inferredCustomDecks.forEach((deck) => {
      if (!customMap.has(deck.id)) {
        customMap.set(deck.id, {
          id: deck.id,
          label: deck.label,
          description: "",
          icon: "",
          color: "teal"
        });
      }
    });

    const mergedCustom = Array.from(customMap.values()).map((deck) => ({
      id: deck.id,
      label: deck.label,
      description: deck.description || "Custom deck",
      icon: "custom" as const,
      color: deck.color,
      colorClass: getDeckColorClass(deck.color)
    }));

    return [
      ...mergedCustom,
      {
        id: "debug",
        label: "Debug",
        description: "Track defects and unstable behavior",
        icon: "debug",
        color: "debug",
        colorClass: getDeckColorClass("debug")
      },
      {
        id: "completed",
        label: "Completed",
        description: "Finished cards and shipped work",
        icon: "completed",
        color: "completed",
        colorClass: getDeckColorClass("completed")
      }
    ];
  }, [customDecks, inferredCustomDecks]);

  useEffect(() => {
    if (activeDeckId && !allDecks.some((deck) => deck.id === activeDeckId)) {
      setActiveDeckId(null);
    }
  }, [activeDeckId, allDecks]);

  const deckCounts = useMemo(() => {
    const counts = new Map<string, number>();

    allDecks.forEach((deck) => {
      if (deck.id === "debug") {
        counts.set(deck.id, cards.filter((card) => card.type === "bug").length);
        return;
      }

      if (deck.id === "completed") {
        counts.set(deck.id, cards.filter((card) => card.status === "completed").length);
        return;
      }

      const targetTag = `${CUSTOM_DECK_PREFIX}${deck.id}`;
      counts.set(deck.id, cards.filter((card) => card.tags.includes(targetTag)).length);
    });

    return counts;
  }, [allDecks, cards]);

  const activeDeck = useMemo(() => {
    if (!activeDeckId) {
      return null;
    }

    return allDecks.find((deck) => deck.id === activeDeckId) ?? null;
  }, [activeDeckId, allDecks]);

  const activeDeckCards = useMemo(() => {
    if (!activeDeck) {
      return [];
    }

    if (activeDeck.id === "debug") {
      return cards.filter((card) => card.type === "bug");
    }

    if (activeDeck.id === "completed") {
      return cards.filter((card) => card.status === "completed");
    }

    const targetTag = `${CUSTOM_DECK_PREFIX}${activeDeck.id}`;
    return cards.filter((card) => card.tags.includes(targetTag));
  }, [activeDeck, cards]);

  const sortedActiveDeckCards = useMemo(
    () =>
      [...activeDeckCards].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [activeDeckCards]
  );

  const resetDeckModalForm = () => {
    setNewDeckName("");
    setNewDeckDescription("");
    setNewDeckIcon("");
    setNewDeckColor("teal");
  };

  const handleCreateDeck = () => {
    const trimmed = newDeckName.trim();
    const id = toDeckId(trimmed);

    if (!trimmed || !id || FIXED_DECK_IDS.includes(id as (typeof FIXED_DECK_IDS)[number])) {
      return;
    }

    const exists = allDecks.some((deck) => deck.id === id);
    if (exists) {
      setActiveDeckId(id);
      setIsCreateDeckModalOpen(false);
      resetDeckModalForm();
      return;
    }

    setCustomDecks((previous) => [
      ...previous,
      {
        id,
        label: trimmed,
        description: newDeckDescription.trim(),
        icon: newDeckIcon.trim(),
        color: newDeckColor
      }
    ]);

    setActiveDeckId(id);
    setIsCreateDeckModalOpen(false);
    resetDeckModalForm();
  };

  const handleDeckQuickAdd = async () => {
    if (!token || !activeProject || !activeDeck || !deckQuickTitle.trim()) {
      return;
    }

    setIsDeckQuickAdding(true);

    try {
      const isDebugDeck = activeDeck.id === "debug";
      const isCompletedDeck = activeDeck.id === "completed";
      const customDeckTag =
        !isDebugDeck && !isCompletedDeck ? `${CUSTOM_DECK_PREFIX}${activeDeck.id}` : undefined;

      await createCard(token, {
        title: deckQuickTitle.trim(),
        description: "",
        type: isDebugDeck ? "bug" : "feature",
        priority: priorityMap[deckQuickPriority],
        difficulty: 1,
        status: isCompletedDeck ? "completed" : "deck",
        projectId: activeProject.id,
        tags: customDeckTag ? [customDeckTag] : [],
        checklist: []
      });

      setDeckQuickTitle("");
      setDeckQuickPriority("medium");
      setIsDeckQuickAddOpen(false);
    } finally {
      setIsDeckQuickAdding(false);
    }
  };

  const sidebar = (
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
          activeTab={activeTab}
          onTabChange={setActiveTab}
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
            {activeTab === "board" ? (
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
            ) : null}

            {activeTab === "decks" ? (
              <div className="space-y-4">
                {!activeDeck ? (
                  <>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-sky-300">Decks</p>
                      <h2 className="mt-2 font-display text-2xl font-semibold text-white">Choose a deck</h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Pick a deck card to open it. Debug and Completed stay pinned at the end.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => setIsCreateDeckModalOpen(true)}
                        className="group flex aspect-[3/4] min-h-56 flex-col rounded-2xl border border-dashed border-sky-300/30 bg-sky-500/10 p-4 text-left transition hover:scale-[1.01]"
                      >
                        <div className="flex items-center justify-between text-sky-200">
                          <div className="rounded-xl bg-black/20 p-2">
                            <PlusCircle className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-semibold uppercase tracking-[0.1em]">New</span>
                        </div>
                        <div className="mt-auto">
                          <p className="text-xl font-semibold text-white">Add Deck</p>
                          <p className="mt-1 text-xs text-sky-100/90">Create a custom deck category</p>
                        </div>
                      </button>

                      {allDecks.map((deck) => {
                        const icon =
                          deck.icon === "debug" ? (
                            <Bug className="h-5 w-5" />
                          ) : deck.icon === "completed" ? (
                            <Trophy className="h-5 w-5" />
                          ) : (
                            <Layers3 className="h-5 w-5" />
                          );

                        return (
                          <button
                            key={deck.id}
                            type="button"
                            onClick={() => {
                              setActiveDeckId(deck.id);
                              setIsDeckQuickAddOpen(false);
                              setDeckQuickTitle("");
                            }}
                            className={`group flex aspect-[3/4] min-h-56 flex-col rounded-2xl border p-4 text-left transition hover:scale-[1.01] ${deck.colorClass}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="rounded-xl bg-black/20 p-2">{icon}</div>
                              <span className="text-xs font-semibold tracking-[0.08em] text-white/80">
                                {deckCounts.get(deck.id) ?? 0} cards
                              </span>
                            </div>
                            <div className="mt-auto">
                              <p className="text-xl font-semibold text-white">{deck.label}</p>
                              <p className="mt-1 line-clamp-2 text-xs text-white/75">{deck.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDeckId(null);
                            setIsDeckQuickAddOpen(false);
                            setDeckQuickTitle("");
                          }}
                          className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 hover:text-white"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          Back To Decks
                        </button>
                        <h3 className="font-display text-2xl font-semibold text-white">{activeDeck.label}</h3>
                        <p className="mt-1 text-sm text-slate-400">{activeDeck.description}</p>
                      </div>

                      <Button
                        onClick={() => {
                          setIsDeckQuickAddOpen((previous) => !previous);
                          setTimeout(() => deckQuickTitleRef.current?.focus(), 0);
                        }}
                      >
                        Quick Add Card
                      </Button>
                    </div>

                    {isDeckQuickAddOpen ? (
                      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                          <input
                            ref={deckQuickTitleRef}
                            value={deckQuickTitle}
                            onChange={(event) => setDeckQuickTitle(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void handleDeckQuickAdd();
                              }
                            }}
                            placeholder="Card title"
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none"
                          />

                          <select
                            value={deckQuickPriority}
                            onChange={(event) =>
                              setDeckQuickPriority(event.target.value as "low" | "medium" | "high")
                            }
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none"
                          >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                          </select>

                          <Button
                            onClick={() => void handleDeckQuickAdd()}
                            disabled={isDeckQuickAdding || !deckQuickTitle.trim()}
                            className="min-w-32"
                          >
                            {isDeckQuickAdding ? "Adding..." : "Add"}
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-white">Cards In {activeDeck.label}</h4>
                        <span className="text-sm text-slate-400">{sortedActiveDeckCards.length} total</span>
                      </div>

                      {sortedActiveDeckCards.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-6 text-sm text-slate-500">
                          No cards in this deck yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {sortedActiveDeckCards.map((card) => (
                            <div
                              key={card.id}
                              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 md:flex-row md:items-center md:justify-between"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{card.title}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                  <span className="rounded-md bg-slate-800 px-2 py-0.5">
                                    {card.priority}
                                  </span>
                                  <span className="rounded-md bg-slate-800 px-2 py-0.5">
                                    {card.status.replace("_", " ")}
                                  </span>
                                  <span className="rounded-md bg-slate-800 px-2 py-0.5">
                                    {card.xpValue} XP
                                  </span>
                                </div>
                              </div>

                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingCard(card);
                                  setDraftStatus(card.status);
                                  setIsEditorOpen(true);
                                }}
                              >
                                Edit Details
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {activeTab === "activity" ? (
              <div className="flex min-h-[22rem] items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/30 text-center">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-white">Activity stream coming next</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Use the Decks tab to organize work and quickly add cards where they belong.
                  </p>
                </div>
              </div>
            ) : null}

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

        {isLoadingCards && activeProject ? (
          <p className="mt-4 text-sm text-slate-500">Loading cards...</p>
        ) : null}
      </DashboardLayout>

      <Modal
        isOpen={isCreateDeckModalOpen}
        title="Create A New Deck"
        description="Define your deck metadata now. We will wire icon rendering later."
        onClose={() => {
          setIsCreateDeckModalOpen(false);
          resetDeckModalForm();
        }}
      >
        <div className="space-y-4">
          <label className="block text-sm text-slate-300">
            Deck Name
            <input
              value={newDeckName}
              onChange={(event) => setNewDeckName(event.target.value)}
              placeholder="UI Systems"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Details
            <textarea
              value={newDeckDescription}
              onChange={(event) => setNewDeckDescription(event.target.value)}
              placeholder="What kind of work belongs in this deck?"
              rows={3}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Icon (Placeholder)
            <div className="mt-2 flex items-center gap-3">
              <input
                value={newDeckIcon}
                onChange={(event) => setNewDeckIcon(event.target.value)}
                placeholder="sparkles"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none"
              />
              <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </label>

          <div>
            <p className="text-sm text-slate-300">Color</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {COLOR_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setNewDeckColor(option.value)}
                  className={`rounded-xl border px-3 py-2 text-sm transition ${option.className} ${
                    newDeckColor === option.value ? "ring-2 ring-white/60" : ""
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreateDeckModalOpen(false);
                resetDeckModalForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateDeck} disabled={!newDeckName.trim()}>
              Create Deck
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
