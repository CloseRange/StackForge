import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bug, Layers3, PlusCircle, Sparkles, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ClaimBoard } from "../components/board/ClaimBoard";
import { CardEditorModal } from "../components/cards/CardEditorModal";
import { Header } from "../components/header/Header";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../hooks/useAuth";
import { useBoardStore } from "../hooks/useBoardStore";
import { DashboardLayout } from "../layouts/DashboardLayout";
import type { Card, CardDifficulty, CardPriority, Deck, DeckColor } from "../types/api";

type ProjectTab = "board" | "decks" | "activity";

type DeckCard = {
  id: string;
  completionTargetDeckId: string;
  label: string;
  description: string;
  icon: "debug" | "completed" | "custom";
  iconValue: string;
  color: DeckColor;
  colorClass: string;
  isAccessible: boolean;
  allowAssignment: boolean;
  isSystem: boolean;
  systemKey: string | null;
  xpPayout: number;
};

const COLOR_OPTIONS: Array<{
  value: Exclude<DeckColor, "emerald">;
  label: string;
  className: string;
}> = [
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

const getDeckColorClass = (color: DeckColor) => {
  if (color === "emerald") {
    return "border-emerald-300/30 bg-emerald-500/10 text-emerald-100";
  }

  const option = COLOR_OPTIONS.find((entry) => entry.value === color);
  return option?.className ?? "border-teal-300/30 bg-teal-500/10 text-teal-100";
};

const toDeckCard = (deck: Deck): DeckCard => ({
  id: deck.id,
  completionTargetDeckId: deck.completionTargetDeckId,
  label: deck.name,
  description: deck.description || "Custom deck",
  icon: deck.systemKey === "DEBUG" ? "debug" : deck.systemKey === "COMPLETED" ? "completed" : "custom",
  iconValue: deck.icon || "",
  color: deck.color,
  colorClass: getDeckColorClass(deck.color),
  isAccessible: deck.isAccessible,
  allowAssignment: deck.allowAssignment,
  isSystem: deck.isSystem,
  systemKey: deck.systemKey ?? null,
  xpPayout: deck.xpPayout ?? 0
});

const cardBelongsToDeck = (card: Card, deck: DeckCard) => {
  return card.deckId === deck.id;
};

export const BoardPage = ({ tab }: { tab: ProjectTab }) => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const {
    projects,
    cards,
    decks,
    selectedProjectId,
    isLoadingCards,
    isLoadingDecks,
    error,
    clearError,
    loadProjects,
    loadCards,
    loadDecks,
    createCard,
    removeCard,
    createDeck,
    updateDeck,
    removeDeck,
    updateCard,
  } = useBoardStore();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [isCreateDeckModalOpen, setIsCreateDeckModalOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDescription, setNewDeckDescription] = useState("");
  const [newDeckIcon, setNewDeckIcon] = useState("");
  const [newDeckColor, setNewDeckColor] = useState<Exclude<DeckColor, "emerald">>("teal");
  const [newDeckIsAccessible, setNewDeckIsAccessible] = useState(true);
  const [newDeckCompletionTargetId, setNewDeckCompletionTargetId] = useState("");
  const [newDeckXpPayout, setNewDeckXpPayout] = useState(0);
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [isEditDeckModalOpen, setIsEditDeckModalOpen] = useState(false);
  const [editDeckName, setEditDeckName] = useState("");
  const [editDeckDescription, setEditDeckDescription] = useState("");
  const [editDeckIcon, setEditDeckIcon] = useState("");
  const [editDeckColor, setEditDeckColor] = useState<Exclude<DeckColor, "emerald">>("teal");
  const [editDeckIsAccessible, setEditDeckIsAccessible] = useState(true);
  const [editDeckCompletionTargetId, setEditDeckCompletionTargetId] = useState("");
  const [editDeckXpPayout, setEditDeckXpPayout] = useState(0);
  const [isUpdatingDeck, setIsUpdatingDeck] = useState(false);
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);
  const [deckQuickTitle, setDeckQuickTitle] = useState("");
  const [deckQuickPriority, setDeckQuickPriority] = useState<CardPriority>("uncommon");
  const [deckQuickDifficulty, setDeckQuickDifficulty] = useState<CardDifficulty>("easy");
  const [isDeckQuickAdding, setIsDeckQuickAdding] = useState(false);
  const [isDeckQuickAddOpen, setIsDeckQuickAddOpen] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  const deckQuickTitleRef = useRef<HTMLInputElement>(null);
  const isDeckQuickAddInFlightRef = useRef(false);

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

    void Promise.all([loadCards(token, selectedProjectId), loadDecks(token, selectedProjectId)]);
  }, [loadCards, loadDecks, selectedProjectId, token]);

  useEffect(() => {
    setActiveDeckId(null);
    setIsDeckQuickAddOpen(false);
    setDeckQuickTitle("");
    setDeckQuickPriority("uncommon");
    setDeckQuickDifficulty("easy");
  }, [selectedProjectId]);

  const activeProject = projects.find((project) => project.id === selectedProjectId) ?? null;

  const openNewCard = () => {
    setEditingCard(null);
    setIsEditorOpen(true);
  };

  const allDecks = useMemo<DeckCard[]>(() => decks.map(toDeckCard), [decks]);
  const completedDeckId = useMemo(
    () => allDecks.find((deck) => deck.systemKey === "COMPLETED")?.id ?? "",
    [allDecks]
  );

  useEffect(() => {
    if (!newDeckCompletionTargetId && completedDeckId) {
      setNewDeckCompletionTargetId(completedDeckId);
    }
  }, [completedDeckId, newDeckCompletionTargetId]);

  useEffect(() => {
    if (activeDeckId && !allDecks.some((deck) => deck.id === activeDeckId)) {
      setActiveDeckId(null);
    }
  }, [activeDeckId, allDecks]);

  const deckCounts = useMemo(() => {
    const counts = new Map<string, number>();

    allDecks.forEach((deck) => {
      counts.set(
        deck.id,
        cards.reduce((sum, card) => (cardBelongsToDeck(card, deck) ? sum + 1 : sum), 0)
      );
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

    return cards.filter((card) => cardBelongsToDeck(card, activeDeck));
  }, [activeDeck, cards]);

  const sortedActiveDeckCards = useMemo(
    () =>
      [...activeDeckCards].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [activeDeckCards]
  );

  const boardVisibleCards = useMemo(() => {
    const deckById = new Map(decks.map((deck) => [deck.id, deck]));

    return cards.filter((card) => {
      const deck = deckById.get(card.deckId);
      return deck ? deck.isAccessible : true;
    });
  }, [cards, decks]);

  const defaultModalDeckId = useMemo(() => {
    if (activeDeck) {
      return activeDeck.id;
    }

    return decks.find((deck) => deck.isAccessible)?.id ?? decks[0]?.id;
  }, [activeDeck, decks]);

  const isEditingCardAssignmentBlocked = useMemo(() => {
    if (!editingCard?.deckId) {
      return false;
    }

    const deck = decks.find((entry) => entry.id === editingCard.deckId);

    if (!deck) {
      return false;
    }

    return !deck.isAccessible || !deck.allowAssignment;
  }, [decks, editingCard]);

  const resetDeckModalForm = () => {
    setNewDeckName("");
    setNewDeckDescription("");
    setNewDeckIcon("");
    setNewDeckColor("teal");
    setNewDeckIsAccessible(true);
    setNewDeckCompletionTargetId(completedDeckId);
    setNewDeckXpPayout(0);
  };

  const openEditDeckModal = () => {
    if (!activeDeck) {
      return;
    }

    setEditDeckName(activeDeck.label);
    setEditDeckDescription(activeDeck.description || "");
    setEditDeckIcon(activeDeck.iconValue || "");
    setEditDeckColor(activeDeck.color === "emerald" ? "teal" : activeDeck.color);
    setEditDeckIsAccessible(activeDeck.isAccessible);
    setEditDeckCompletionTargetId(activeDeck.completionTargetDeckId);
    setEditDeckXpPayout(activeDeck.xpPayout);
    setIsEditDeckModalOpen(true);
  };

  const resetEditDeckModalForm = () => {
    setEditDeckName("");
    setEditDeckDescription("");
    setEditDeckIcon("");
    setEditDeckColor("teal");
    setEditDeckIsAccessible(true);
    setEditDeckCompletionTargetId("");
    setEditDeckXpPayout(0);
  };

  const handleCreateDeck = async () => {
    if (!token || !activeProject || !newDeckName.trim()) {
      return;
    }

    setIsCreatingDeck(true);

    try {
      const deck = await createDeck(token, {
        projectId: activeProject.id,
        completionTargetDeckId: newDeckCompletionTargetId || completedDeckId || undefined,
        name: newDeckName.trim(),
        description: newDeckDescription.trim(),
        icon: newDeckIcon.trim(),
        color: newDeckColor,
        isAccessible: newDeckIsAccessible,
        allowAssignment: newDeckIsAccessible,
        xpPayout: newDeckXpPayout
      });

      setActiveDeckId(deck.id);
      setIsCreateDeckModalOpen(false);
      resetDeckModalForm();
    } finally {
      setIsCreatingDeck(false);
    }
  };

  const handleDeckQuickAdd = async () => {
    const trimmedTitle = deckQuickTitle.trim();

    if (
      !token ||
      !activeProject ||
      !activeDeck ||
      !trimmedTitle ||
      isDeckQuickAddInFlightRef.current
    ) {
      return;
    }

    isDeckQuickAddInFlightRef.current = true;

    setIsDeckQuickAdding(true);
    setDeckQuickTitle("");

    try {
      const selectedPriority = deckQuickPriority;
      const selectedDifficulty = deckQuickDifficulty;

      await createCard(token, {
        title: trimmedTitle,
        description: "",
        priority: selectedPriority,
        difficulty: selectedDifficulty,
        projectId: activeProject.id,
        deckId: activeDeck.id,
        tags: [],
        checklist: []
      });

      setTimeout(() => deckQuickTitleRef.current?.focus(), 0);
    } catch {
      // Keep failed input so retry is immediate when request errors out.
      setDeckQuickTitle(trimmedTitle);
    } finally {
      isDeckQuickAddInFlightRef.current = false;
      setIsDeckQuickAdding(false);
    }
  };

  const handleUpdateDeck = async () => {
    if (!token || !activeDeck || (!activeDeck.isSystem && !editDeckName.trim())) {
      return;
    }

    setIsUpdatingDeck(true);

    try {
      await updateDeck(token, activeDeck.id, {
        name: activeDeck.isSystem ? undefined : editDeckName.trim(),
        completionTargetDeckId: editDeckCompletionTargetId || completedDeckId || undefined,
        description: editDeckDescription.trim(),
        icon: editDeckIcon.trim(),
        color: editDeckColor,
        isAccessible: editDeckIsAccessible,
        allowAssignment: editDeckIsAccessible,
        xpPayout: editDeckXpPayout
      });

      setIsEditDeckModalOpen(false);
      resetEditDeckModalForm();
    } catch {
      // Error surfaced via board store error banner.
    } finally {
      setIsUpdatingDeck(false);
    }
  };

  const handleDeleteCard = async (card: Card) => {
    if (!token) {
      return;
    }

    const shouldDelete = globalThis.confirm(`Delete card "${card.title}"?`);

    if (!shouldDelete) {
      return;
    }

    setDeletingCardId(card.id);

    try {
      await removeCard(token, card.id);
    } catch {
      // Error surfaced via board store error banner.
    } finally {
      setDeletingCardId((current) => (current === card.id ? null : current));
    }
  };

  const handleDeleteActiveDeck = async () => {
    if (!token || !activeDeck || activeDeck.isSystem) {
      return;
    }

    const shouldDelete = globalThis.confirm(
      `Delete deck "${activeDeck.label}"? Cards will remain and be unassigned from this deck.`
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeletingDeck(true);

    try {
      await removeDeck(token, activeDeck.id);
      setActiveDeckId(null);
      setIsDeckQuickAddOpen(false);
      setDeckQuickTitle("");
    } catch {
      // Error surfaced via board store error banner.
    } finally {
      setIsDeletingDeck(false);
    }
  };

  const totalXp = cards.reduce((sum, c) => sum + (c.xpValue ?? 0), 0);

  const deckPayoutMap = useMemo(() => {
    const map = new Map<string, number>();
    decks.forEach((deck) => map.set(deck.id, deck.xpPayout ?? 0));
    return map;
  }, [decks]);

  const earnedXp = useMemo(
    () =>
      cards.reduce((sum, c) => {
        const payout = deckPayoutMap.get(c.deckId) ?? 0;
        return sum + Math.round((c.xpValue ?? 0) * payout / 100);
      }, 0),
    [cards, deckPayoutMap]
  );

  const handleTabChange = (nextTab: ProjectTab) => {
    if (nextTab === "board") {
      navigate("/board");
      return;
    }

    navigate(`/${nextTab}`);
  };

  return (
    <>
      {activeProject ? (
        <Header
          variant="project"
          projectName={activeProject.name}
          xp={earnedXp}
          xpMax={totalXp || 1}
          activeTab={tab}
          onTabChange={handleTabChange}
        />
      ) : (
        <Header
          variant="dashboard"
          onNewProject={() => navigate("/")}
        />
      )}

      <DashboardLayout>
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
            {tab === "board" ? (
              <ClaimBoard
                cards={boardVisibleCards}
                decks={decks}
                currentUser={user!}
                onCreateCard={openNewCard}
                onSelectCard={(card) => {
                  setEditingCard(card);
                  setIsEditorOpen(true);
                }}
                onUpdateCard={async (cardId, payload) => {
                  if (!token) {
                    return;
                  }

                  await updateCard(token, cardId, payload);
                }}
              />
            ) : null}

            {tab === "decks" ? (
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

                    {isLoadingDecks ? (
                      <p className="text-sm text-slate-500">Loading decks...</p>
                    ) : null}

                    <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(10rem,10rem))] sm:[grid-template-columns:repeat(auto-fill,minmax(11rem,11rem))]">
                      {/* New deck card */}
                      <button
                        type="button"
                        onClick={() => setIsCreateDeckModalOpen(true)}
                        className="group relative flex aspect-[2/3] w-full flex-col rounded-[1.25rem] border border-dashed border-sky-300/30 bg-sky-500/10 p-4 text-left shadow-[2px_4px_0_1px_rgba(0,0,0,0.35),5px_8px_0_1px_rgba(0,0,0,0.22)] transition hover:-translate-y-1.5 hover:shadow-[2px_6px_0_1px_rgba(0,0,0,0.45),5px_11px_0_1px_rgba(0,0,0,0.28)]"
                      >
                        <div className="text-sky-300">
                          <PlusCircle className="h-5 w-5" />
                        </div>
                        <div className="mt-auto">
                          <p className="text-sm font-bold leading-tight text-white">New Deck</p>
                          <p className="mt-1 text-[11px] text-sky-200/70">Add a category</p>
                        </div>
                        <div className="absolute right-2.5 top-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-sky-300/50 [writing-mode:vertical-rl]">new</div>
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

                        const count = deckCounts.get(deck.id) ?? 0;

                        return (
                          <button
                            key={deck.id}
                            type="button"
                            onClick={() => {
                              setActiveDeckId(deck.id);
                              setIsDeckQuickAddOpen(false);
                              setDeckQuickTitle("");
                            }}
                            className={`group relative flex aspect-[2/3] w-full flex-col rounded-[1.25rem] border p-4 text-left shadow-[2px_4px_0_1px_rgba(0,0,0,0.45),5px_8px_0_1px_rgba(0,0,0,0.28)] transition hover:-translate-y-1.5 hover:shadow-[2px_6px_0_1px_rgba(0,0,0,0.55),5px_11px_0_1px_rgba(0,0,0,0.38)] ${deck.colorClass}`}
                          >
                            {/* Suit pip + count */}
                            <div className="flex items-center gap-1.5 opacity-90">
                              {icon}
                              <span className="text-xs font-bold leading-none text-white/70">{count}</span>
                            </div>

                            {/* Faint centre watermark */}
                            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[3] opacity-[0.06] transition group-hover:opacity-[0.10]">
                              {icon}
                            </div>

                            {/* Bottom label block */}
                            <div className="mt-auto">
                              <p className="line-clamp-2 text-sm font-bold leading-tight text-white">{deck.label}</p>
                              {!deck.isAccessible ? (
                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50">hidden</p>
                              ) : null}
                            </div>

                            {/* Rotated spine label */}
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/25 [writing-mode:vertical-rl]">
                              {deck.label}
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

                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={openEditDeckModal}>
                          Edit Details
                        </Button>
                        {!activeDeck.isSystem ? (
                          <Button
                            variant="ghost"
                            onClick={() => void handleDeleteActiveDeck()}
                            disabled={isDeletingDeck}
                          >
                            {isDeletingDeck ? "Deleting..." : "Delete Deck"}
                          </Button>
                        ) : null}
                        <Button
                          onClick={() => {
                            setIsDeckQuickAddOpen((previous) => {
                              const next = !previous;

                              if (next) {
                                setTimeout(() => deckQuickTitleRef.current?.focus(), 0);
                              }

                              return next;
                            });
                          }}
                        >
                          Quick Add Card
                        </Button>
                      </div>
                    </div>

                    {isDeckQuickAddOpen ? (
                      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                        <div className="grid gap-3 md:grid-cols-[1fr_190px_170px_auto]">
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
                              setDeckQuickPriority(event.target.value as CardPriority)
                            }
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none"
                          >
                            <option value="common">Common</option>
                            <option value="uncommon">Uncommon</option>
                            <option value="rare">Rare</option>
                            <option value="legendary">Legendary</option>
                          </select>

                          <select
                            value={deckQuickDifficulty}
                            onChange={(event) =>
                              setDeckQuickDifficulty(event.target.value as CardDifficulty)
                            }
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                            <option value="epic">Epic</option>
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
                        <p className="rounded-xl border border-dashed border-white/15 bg-slate-800/30 px-4 py-6 text-sm text-slate-500">
                          No cards in this deck yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {sortedActiveDeckCards.map((card) => (
                            <div
                              key={card.id}
                              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 md:flex-row md:items-center md:justify-between"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{card.title}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                  <span className="rounded-md bg-slate-800 px-2 py-0.5">
                                    {card.priority}
                                  </span>
                                  <span className="rounded-md bg-slate-800 px-2 py-0.5">
                                    {card.xpValue} XP
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditingCard(card);
                                    setIsEditorOpen(true);
                                  }}
                                >
                                  Edit Details
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="text-rose-200 hover:bg-rose-500/15 hover:text-rose-100"
                                  onClick={() => void handleDeleteCard(card)}
                                  disabled={deletingCardId === card.id}
                                >
                                  {deletingCardId === card.id ? "Deleting..." : "Delete"}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {tab === "activity" ? (
              <div className="flex min-h-[22rem] items-center justify-center rounded-[1.5rem] border border-dashed border-white/15 bg-slate-800/20 text-center">
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
              decks={decks}
              defaultDeckId={defaultModalDeckId}
              isAssignmentBlocked={isEditingCardAssignmentBlocked}
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
          <div className="flex min-h-[28rem] items-center justify-center rounded-[2rem] border border-dashed border-white/15 bg-slate-800/20 text-center">
            <div>
              <h2 className="font-display text-2xl font-semibold text-white">Pick a project first</h2>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Open the projects home page, choose a campaign, then come back to board, decks, or activity.
              </p>
              <Button className="mt-4" onClick={() => navigate("/")}>Go To Projects</Button>
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
        description="Deck metadata is now persisted to your project in the database."
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
            Completion Target
            <select
              value={newDeckCompletionTargetId}
              onChange={(event) => setNewDeckCompletionTargetId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none"
            >
              {allDecks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={newDeckIsAccessible}
              onChange={(event) => setNewDeckIsAccessible(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5"
            />
            Visible on board and assignable
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

          <div>
            <p className="text-sm text-slate-300">XP Payout</p>
            <p className="mt-0.5 text-xs text-slate-400">Percentage of a card's XP counted toward project progress when the card sits in this deck.</p>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {([0, 25, 50, 75, 100] as const).map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setNewDeckXpPayout(pct)}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    newDeckXpPayout === pct
                      ? "border-amber-300/60 bg-amber-400/20 text-amber-100 ring-2 ring-amber-300/40"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {pct}%
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
            <Button onClick={() => void handleCreateDeck()} disabled={isCreatingDeck || !newDeckName.trim()}>
              {isCreatingDeck ? "Creating..." : "Create Deck"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditDeckModalOpen}
        title="Edit Deck"
        description="Rename deck or update metadata."
        onClose={() => {
          setIsEditDeckModalOpen(false);
          resetEditDeckModalForm();
        }}
      >
        <div className="space-y-4">
          <label className="block text-sm text-slate-300">
            Deck Name
            <input
              value={editDeckName}
              onChange={(event) => setEditDeckName(event.target.value)}
              placeholder="UI Systems"
              disabled={activeDeck?.isSystem}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none"
            />
          </label>

          {activeDeck?.isSystem ? (
            <p className="text-xs text-slate-500">System deck names are fixed, but you can still edit details below.</p>
          ) : null}

          <label className="block text-sm text-slate-300">
            Completion Target
            <select
              value={editDeckCompletionTargetId}
              onChange={(event) => setEditDeckCompletionTargetId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none"
            >
              {allDecks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={editDeckIsAccessible}
              onChange={(event) => setEditDeckIsAccessible(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5"
            />
            Visible on board and assignable
          </label>

          <label className="block text-sm text-slate-300">
            Details
            <textarea
              value={editDeckDescription}
              onChange={(event) => setEditDeckDescription(event.target.value)}
              placeholder="What kind of work belongs in this deck?"
              rows={3}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Icon (Placeholder)
            <div className="mt-2 flex items-center gap-3">
              <input
                value={editDeckIcon}
                onChange={(event) => setEditDeckIcon(event.target.value)}
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
                  onClick={() => setEditDeckColor(option.value)}
                  className={`rounded-xl border px-3 py-2 text-sm transition ${option.className} ${
                    editDeckColor === option.value ? "ring-2 ring-white/60" : ""
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-300">XP Payout</p>
            <p className="mt-0.5 text-xs text-slate-400">Percentage of a card's XP counted toward project progress when the card sits in this deck.</p>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {([0, 25, 50, 75, 100] as const).map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setEditDeckXpPayout(pct)}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    editDeckXpPayout === pct
                      ? "border-amber-300/60 bg-amber-400/20 text-amber-100 ring-2 ring-amber-300/40"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditDeckModalOpen(false);
                resetEditDeckModalForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleUpdateDeck()}
              disabled={isUpdatingDeck || (!activeDeck?.isSystem && !editDeckName.trim())}
            >
              {isUpdatingDeck ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
