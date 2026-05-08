import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bug,
  ChevronDown,
  ChevronUp,
  Clock3,
  Layers3,
  PencilLine,
  PlusCircle,
  Sparkles,
  Trophy,
  UserMinus,
  UserPlus,
  Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ClaimBoard } from "../components/board/ClaimBoard";
import { CardEditorModal } from "../components/cards/CardEditorModal";
import { Header } from "../components/header/Header";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../hooks/useAuth";
import { useBoardStore } from "../hooks/useBoardStore";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { projectService } from "../services/projectService";
import type {
  Card,
  CardDifficulty,
  CardPriority,
  Deck,
  DeckColor,
  ProjectActivityEvent,
  ProjectActivityResponse,
  ProjectMember
} from "../types/api";

type ProjectTab = "board" | "decks" | "members" | "activity";

type DeckPermissionMode = "FULL_ACCESS" | "NO_ACCESS" | "WHITELIST" | "BLACKLIST";

type MemberPermissionDraft = {
  role: "MEMBER" | "ADMIN";
  deckReadMode: DeckPermissionMode;
  deckReadDeckIds: string[];
  deckWriteMode: DeckPermissionMode;
  deckWriteDeckIds: string[];
};

const DECK_PERMISSION_MODE_OPTIONS: Array<{ value: DeckPermissionMode; label: string }> = [
  { value: "FULL_ACCESS", label: "Full Access" },
  { value: "NO_ACCESS", label: "No Access" },
  { value: "WHITELIST", label: "Whitelist" },
  { value: "BLACKLIST", label: "Blacklist" }
];

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

const deckCardSurfaceClass: Record<DeckColor, string> = {
  teal:
    "border-teal-400/45 bg-[radial-gradient(ellipse_at_0%_50%,rgba(45,212,191,0.38),transparent_65%),linear-gradient(180deg,rgba(24,46,48,0.88),rgba(14,26,32,0.94))]",
  cyan:
    "border-cyan-400/45 bg-[radial-gradient(ellipse_at_0%_50%,rgba(34,211,238,0.38),transparent_65%),linear-gradient(180deg,rgba(20,44,52,0.88),rgba(12,24,34,0.94))]",
  amber:
    "border-amber-400/45 bg-[radial-gradient(ellipse_at_0%_50%,rgba(245,158,11,0.38),transparent_65%),linear-gradient(180deg,rgba(44,38,20,0.88),rgba(28,22,12,0.94))]",
  rose:
    "border-rose-400/45 bg-[radial-gradient(ellipse_at_0%_50%,rgba(244,63,94,0.38),transparent_65%),linear-gradient(180deg,rgba(48,24,30,0.88),rgba(30,14,20,0.94))]",
  indigo:
    "border-violet-400/45 bg-[radial-gradient(ellipse_at_0%_50%,rgba(139,92,246,0.40),transparent_65%),linear-gradient(180deg,rgba(34,26,58,0.88),rgba(20,16,40,0.94))]",
  emerald:
    "border-emerald-400/45 bg-[radial-gradient(ellipse_at_0%_50%,rgba(16,185,129,0.38),transparent_65%),linear-gradient(180deg,rgba(18,46,36,0.88),rgba(10,28,22,0.94))]"
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

type ActivityFilter = "all" | "project" | "card" | "deck" | "member";

const ACTIVITY_FILTERS: Array<{ value: ActivityFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "project", label: "Project" },
  { value: "card", label: "Cards" },
  { value: "deck", label: "Decks" },
  { value: "member", label: "Members" }
];

const formatActivityTime = (value: string) => {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
};

const formatActivityAge = (value: string) => {
  const timestamp = new Date(value).getTime();
  const delta = Date.now() - timestamp;

  if (delta < 60_000) {
    return "just now";
  }

  if (delta < 3_600_000) {
    const minutes = Math.floor(delta / 60_000);
    return `${minutes}m ago`;
  }

  if (delta < 86_400_000) {
    const hours = Math.floor(delta / 3_600_000);
    return `${hours}h ago`;
  }

  if (delta < 604_800_000) {
    const days = Math.floor(delta / 86_400_000);
    return `${days}d ago`;
  }

  const weeks = Math.floor(delta / 604_800_000);
  return `${weeks}w ago`;
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

  // Members tab state
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [membersOwnerId, setMembersOwnerId] = useState<string | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<ProjectMember | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [memberPermissionDrafts, setMemberPermissionDrafts] = useState<Record<string, MemberPermissionDraft>>({});
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [deckQuickTitle, setDeckQuickTitle] = useState("");
  const [deckQuickPriority, setDeckQuickPriority] = useState<CardPriority>("uncommon");
  const [deckQuickDifficulty, setDeckQuickDifficulty] = useState<CardDifficulty>("easy");
  const [isDeckQuickAdding, setIsDeckQuickAdding] = useState(false);
  const [isDeckQuickAddOpen, setIsDeckQuickAddOpen] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  
  // Project-wide stats (not filtered by member permissions)
  const [projectTotalXp, setProjectTotalXp] = useState(0);
  const [projectEarnedXp, setProjectEarnedXp] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [activityLimit, setActivityLimit] = useState(30);
  const [activityData, setActivityData] = useState<ProjectActivityResponse | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [selectedActivityEvent, setSelectedActivityEvent] = useState<ProjectActivityEvent | null>(null);

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
    // Reset members when project changes
    setMembers([]);
    setMembersOwnerId(null);
    setOwnerProfile(null);
    setMembersError(null);
    setExpandedMemberId(null);
    setMemberPermissionDrafts({});
    setSavingMemberId(null);
    setActivityFilter("all");
    setActivityLimit(30);
    setSelectedActivityEvent(null);
  }, [selectedProjectId]);

  // Load project-wide stats (not filtered by member permissions)
  useEffect(() => {
    if (!token || !selectedProjectId) {
      return;
    }

    let cancelled = false;
    setIsLoadingStats(true);

    projectService
      .getStats(token, selectedProjectId)
      .then((stats) => {
        if (!cancelled) {
          setProjectTotalXp(stats.totalXp);
          setProjectEarnedXp(stats.earnedXp);
        }
      })
      .catch((err: unknown) => {
        // Silently handle stats load errors
        console.error("Failed to load project stats:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStats(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, selectedProjectId]);

  // Load members when the members tab is opened.
  useEffect(() => {
    if (tab !== "members" || !token || !selectedProjectId) {
      return;
    }

    let cancelled = false;
    setIsLoadingMembers(true);
    setMembersError(null);

    projectService
      .listMembers(token, selectedProjectId)
      .then((result) => {
        if (!cancelled) {
          setMembers(result.members);
          setMembersOwnerId(result.ownerId);
          setOwnerProfile(result.owner);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setMembersError(err instanceof Error ? err.message : "Failed to load members");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMembers(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, token, selectedProjectId]);

  useEffect(() => {
    if (tab !== "activity" || !token || !selectedProjectId) {
      return;
    }

    let cancelled = false;
    setIsLoadingActivity(true);
    setActivityError(null);

    projectService
      .getActivity(token, selectedProjectId, {
        limit: activityLimit,
        entityType: activityFilter === "all" ? undefined : activityFilter
      })
      .then((result) => {
        if (!cancelled) {
          setActivityData(result);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setActivityError(err instanceof Error ? err.message : "Failed to load activity");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingActivity(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activityFilter, activityLimit, selectedProjectId, tab, token]);

  const activeProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const viewerRole =
    user?.id === membersOwnerId
      ? "OWNER"
      : members.find((member) => member.id === user?.id)?.role ?? "MEMBER";
  const canManageMembers = viewerRole === "OWNER" || viewerRole === "ADMIN";

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

  const handleInviteMember = async () => {
    if (!token || !selectedProjectId || !inviteCode.trim()) return;
    setIsInviting(true);
    setMembersError(null);
    try {
      const newMember = await projectService.addMember(token, selectedProjectId, inviteCode.trim());
      setMembers((prev) => [...prev, newMember]);
      setInviteCode("");
    } catch (err: unknown) {
      setMembersError(err instanceof Error ? err.message : "Failed to invite member");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!token || !selectedProjectId) return;
    try {
      await projectService.removeMember(token, selectedProjectId, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err: unknown) {
      setMembersError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const getMemberDraft = (member: ProjectMember): MemberPermissionDraft => {
    return (
      memberPermissionDrafts[member.id] ?? {
        role: member.role === "ADMIN" ? "ADMIN" : "MEMBER",
        deckReadMode: member.deckReadMode,
        deckReadDeckIds: [...member.deckReadDeckIds],
        deckWriteMode: member.deckWriteMode,
        deckWriteDeckIds: [...member.deckWriteDeckIds]
      }
    );
  };

  const updateMemberDraft = (memberId: string, partial: Partial<MemberPermissionDraft>) => {
    setMemberPermissionDrafts((previous) => {
      const base = previous[memberId];

      if (!base) {
        const member = members.find((entry) => entry.id === memberId);

        if (!member) {
          return previous;
        }

        return {
          ...previous,
          [memberId]: {
            role: member.role === "ADMIN" ? "ADMIN" : "MEMBER",
            deckReadMode: member.deckReadMode,
            deckReadDeckIds: [...member.deckReadDeckIds],
            deckWriteMode: member.deckWriteMode,
            deckWriteDeckIds: [...member.deckWriteDeckIds],
            ...partial
          }
        };
      }

      return {
        ...previous,
        [memberId]: {
          ...base,
          ...partial
        }
      };
    });
  };

  const toggleDeckId = (
    memberId: string,
    key: "deckReadDeckIds" | "deckWriteDeckIds",
    deckId: string
  ) => {
    const member = members.find((entry) => entry.id === memberId);

    if (!member) {
      return;
    }

    const draft = getMemberDraft(member);
    const current = draft[key];
    const next = current.includes(deckId)
      ? current.filter((entry) => entry !== deckId)
      : [...current, deckId];

    updateMemberDraft(memberId, { [key]: next } as Partial<MemberPermissionDraft>);
  };

  const handleSaveMemberPermissions = async (member: ProjectMember) => {
    if (!token || !selectedProjectId) {
      return;
    }

    const draft = getMemberDraft(member);
    setSavingMemberId(member.id);
    setMembersError(null);

    try {
      const updatedMember = await projectService.updateMemberPermissions(
        token,
        selectedProjectId,
        member.id,
        draft
      );

      setMembers((previous) =>
        previous.map((entry) => (entry.id === member.id ? updatedMember : entry))
      );

      setMemberPermissionDrafts((previous) => {
        const next = { ...previous };
        delete next[member.id];
        return next;
      });
    } catch (err: unknown) {
      setMembersError(err instanceof Error ? err.message : "Failed to update member permissions");
    } finally {
      setSavingMemberId((current) => (current === member.id ? null : current));
    }
  };

  const formatJoinedAt = (value?: string) => {
    if (!value) {
      return "Unknown";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }

    return date.toLocaleDateString();
  };

  const filteredActivity = activityData?.events ?? [];
  const filteredActivityTotal = activityData?.filteredTotal ?? 0;
  const activityWeekCount = activityData?.last7Days ?? 0;
  const activityTotal = activityData?.total ?? 0;

  const getActivityAccentClass = (entityType: ProjectActivityEvent["entityType"]) => {
    if (entityType === "card") {
      return "border-sky-300/35 bg-sky-500/10 text-sky-100";
    }

    if (entityType === "deck") {
      return "border-amber-300/35 bg-amber-500/10 text-amber-100";
    }

    if (entityType === "member") {
      return "border-fuchsia-300/35 bg-fuchsia-500/10 text-fuchsia-100";
    }

    return "border-emerald-300/35 bg-emerald-500/10 text-emerald-100";
  };

  const getActivityActionLabel = (entry: ProjectActivityEvent) => {
    return `${entry.entityType} ${entry.action}`.replace(/_/g, " ");
  };

  const formatActivityValue = (value: unknown): string => {
    if (value === null || value === undefined || value === "") {
      return "empty";
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return "none";
      }

      if (typeof value[0] === "string" || typeof value[0] === "number") {
        return value.join(", ");
      }

      return `${value.length} items`;
    }

    return "updated";
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
          xp={projectEarnedXp}
          xpMax={projectTotalXp || 1}
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
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-300">Decks</p>
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
                        className="group relative flex aspect-[2/3] w-full flex-col rounded-[1.25rem] border border-dashed border-sky-300/28 bg-[linear-gradient(180deg,rgba(29,40,58,0.92),rgba(17,24,38,0.95))] p-4 text-left shadow-[2px_4px_0_1px_rgba(0,0,0,0.35),5px_8px_0_1px_rgba(0,0,0,0.22)] transition hover:-translate-y-1.5 hover:shadow-[2px_6px_0_1px_rgba(0,0,0,0.45),5px_11px_0_1px_rgba(0,0,0,0.28)]"
                      >
                        <div className="text-sky-300">
                          <PlusCircle className="h-5 w-5" />
                        </div>
                        <div className="mt-auto">
                          <p className="text-sm font-bold leading-tight text-white">New Deck</p>
                          <p className="mt-1 text-[11px] text-slate-300/70">Add a category</p>
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
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/12 p-4">
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDeckId(null);
                            setIsDeckQuickAddOpen(false);
                            setDeckQuickTitle("");
                          }}
                          className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300 hover:text-white"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          Back To Decks
                        </button>
                        <h3 className="font-display text-2xl font-semibold text-white">{activeDeck.label}</h3>
                        <p className="mt-1 text-sm text-slate-300">{activeDeck.description}</p>
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
                      <div className="rounded-2xl border border-white/20 bg-white/12 p-4">
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
                            className="rounded-xl border border-white/20 bg-white/15 px-4 py-2.5 text-sm text-white outline-none"
                          />

                          <select
                            value={deckQuickPriority}
                            onChange={(event) =>
                              setDeckQuickPriority(event.target.value as CardPriority)
                            }
                            className="rounded-xl border border-white/20 bg-white/15 px-3 py-2.5 text-sm text-white outline-none"
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
                            className="rounded-xl border border-white/20 bg-white/15 px-3 py-2.5 text-sm text-white outline-none"
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

                    <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-white">Cards In {activeDeck.label}</h4>
                        <span className="text-sm text-slate-300">{sortedActiveDeckCards.length} total</span>
                      </div>

                      {sortedActiveDeckCards.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-white/20 bg-slate-700/50 px-4 py-6 text-sm text-slate-300">
                          No cards in this deck yet.
                        </p>
                      ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
                          {sortedActiveDeckCards.map((card) => (
                            <div
                              key={card.id}
                              className={`group relative flex aspect-[2/3] flex-col justify-between rounded-xl border p-2 ${deckCardSurfaceClass[activeDeck.color]}`}
                            >
                              {/* action buttons — appear on hover */}
                              <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCard(card);
                                    setIsEditorOpen(true);
                                  }}
                                  className="rounded-md border border-white/15 bg-black/40 p-1 text-slate-300 backdrop-blur-sm hover:bg-white/15 hover:text-white"
                                  title="Edit card"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteCard(card)}
                                  disabled={deletingCardId === card.id}
                                  className="rounded-md border border-rose-400/25 bg-black/40 p-1 text-rose-300 backdrop-blur-sm hover:bg-rose-500/20 hover:text-rose-100 disabled:opacity-50"
                                  title="Delete card"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                </button>
                              </div>

                              {/* card title */}
                              <p className="line-clamp-3 pr-5 text-sm font-semibold leading-snug text-white">
                                {card.title}
                              </p>

                              {/* bottom badges */}
                              <div className="flex flex-wrap gap-1">
                                <span className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 text-[11px] text-slate-300">
                                  {card.priority}
                                </span>
                                <span className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 text-[11px] text-slate-300">
                                  {card.xpValue} XP
                                </span>
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

            {tab === "members" ? (
              <div className="space-y-5">
                {/* Invite section — visible to owner/admin */}
                {canManageMembers ? (
                  <div className="rounded-[1.5rem] border border-white/20 bg-slate-800/70 p-4 md:p-5">
                    <div className="flex items-center gap-2 text-sky-300">
                      <UserPlus className="h-4 w-4" />
                      <p className="text-xs uppercase tracking-[0.35em]">Invite</p>
                    </div>
                    <h2 className="mt-2 font-display text-2xl font-semibold text-white">Add a team member</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Enter a player's 4-character user code to grant them access.
                    </p>

                    {membersError ? (
                      <div className="mt-3 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                        {membersError}
                        <button
                          type="button"
                          onClick={() => setMembersError(null)}
                          className="ml-3 underline opacity-70 hover:opacity-100"
                        >
                          Dismiss
                        </button>
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-col gap-3 md:flex-row">
                      <input
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void handleInviteMember();
                          }
                        }}
                        placeholder="e.g. AB3X"
                        maxLength={10}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-mono uppercase tracking-widest text-white outline-none"
                      />
                      <Button
                        onClick={() => void handleInviteMember()}
                        disabled={isInviting || !inviteCode.trim()}
                        className="md:min-w-36"
                      >
                        {isInviting ? "Inviting..." : "Send Invite"}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {/* Members list */}
                <div className="rounded-[1.5rem] border border-white/20 bg-slate-800/60 p-4 md:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <h3 className="text-lg font-semibold text-white">Team</h3>
                    <span className="ml-auto text-sm text-slate-400">{members.length + 1} people</span>
                  </div>

                  {isLoadingMembers ? (
                    <p className="text-sm text-slate-500">Loading members...</p>
                  ) : (
                    <div className="space-y-2">
                      {/* Owner row */}
                      {ownerProfile ? (
                        <div className="rounded-xl border border-amber-300/25 bg-amber-400/[0.08] px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedMemberId((current) =>
                                current === ownerProfile.id ? null : ownerProfile.id
                              )
                            }
                            className="flex w-full items-center gap-3 text-left"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-300/30 bg-amber-400/10 text-sm font-bold text-amber-200">
                              {(ownerProfile.displayName?.[0] ?? "?").toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-white">{ownerProfile.displayName}</p>
                              <p className="text-xs text-amber-300">Owner</p>
                            </div>
                            {expandedMemberId === ownerProfile.id ? (
                              <ChevronUp className="h-4 w-4 text-amber-200" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-amber-200" />
                            )}
                          </button>

                          {expandedMemberId === ownerProfile.id ? (
                            <div className="mt-3 grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-slate-300 md:grid-cols-2">
                              <p><span className="text-slate-400">Name:</span> {ownerProfile.displayName}</p>
                              <p><span className="text-slate-400">Role:</span> Owner</p>
                              <p><span className="text-slate-400">User Code:</span> {ownerProfile.userCode ? `#${ownerProfile.userCode}` : "N/A"}</p>
                              <p><span className="text-slate-400">Status:</span> {ownerProfile.statusMessage || "No status message"}</p>
                              <p className="md:col-span-2"><span className="text-slate-400">Full Name:</span> {`${ownerProfile.firstName} ${ownerProfile.lastName}`.trim() || "Not set"}</p>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {/* Member rows */}
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedMemberId((current) =>
                                  current === member.id ? null : member.id
                                )
                              }
                              className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-slate-800 text-sm font-bold text-white">
                                {(member.displayName?.[0] ?? "?").toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-white">{member.displayName}</p>
                                <p className="text-xs text-slate-400">
                                  {member.userCode ? `#${member.userCode}` : "Member"}
                                </p>
                              </div>
                              {expandedMemberId === member.id ? (
                                <ChevronUp className="h-4 w-4 text-slate-300" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-300" />
                              )}
                            </button>

                            {canManageMembers ? (
                              <button
                                type="button"
                                onClick={() => void handleRemoveMember(member.id)}
                                className="ml-2 rounded-lg border border-rose-400/20 bg-transparent px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/15 hover:text-rose-100"
                              >
                                <UserMinus className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                          </div>

                          {expandedMemberId === member.id ? (
                            <div className="mt-3 space-y-3 rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
                              <div className="grid gap-2 md:grid-cols-2">
                                <p><span className="text-slate-400">Name:</span> {member.displayName}</p>
                                <p><span className="text-slate-400">Role:</span> {member.role}</p>
                                <p><span className="text-slate-400">User Code:</span> {member.userCode ? `#${member.userCode}` : "N/A"}</p>
                                <p><span className="text-slate-400">Joined:</span> {formatJoinedAt(member.joinedAt)}</p>
                                <p><span className="text-slate-400">Status:</span> {member.statusMessage || "No status message"}</p>
                                <p><span className="text-slate-400">Full Name:</span> {`${member.firstName} ${member.lastName}`.trim() || "Not set"}</p>
                              </div>

                              {canManageMembers ? (
                                <>
                                  <div className="grid gap-3 md:grid-cols-3">
                                    <label className="text-slate-300">
                                      <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-slate-400">Role</span>
                                      <select
                                        value={getMemberDraft(member).role}
                                        onChange={(event) =>
                                          updateMemberDraft(member.id, {
                                            role: event.target.value as "MEMBER" | "ADMIN"
                                          })
                                        }
                                        className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none"
                                      >
                                        <option value="MEMBER">Member</option>
                                        <option value="ADMIN">Admin</option>
                                      </select>
                                    </label>

                                    <label className="text-slate-300">
                                      <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-slate-400">Deck Read</span>
                                      <select
                                        value={getMemberDraft(member).deckReadMode}
                                        onChange={(event) =>
                                          updateMemberDraft(member.id, {
                                            deckReadMode: event.target.value as DeckPermissionMode,
                                            deckReadDeckIds:
                                              event.target.value === "WHITELIST" || event.target.value === "BLACKLIST"
                                                ? getMemberDraft(member).deckReadDeckIds
                                                : []
                                          })
                                        }
                                        className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none"
                                      >
                                        {DECK_PERMISSION_MODE_OPTIONS.map((option) => (
                                          <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                      </select>
                                    </label>

                                    <label className="text-slate-300">
                                      <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-slate-400">Deck Write</span>
                                      <select
                                        value={getMemberDraft(member).deckWriteMode}
                                        onChange={(event) =>
                                          updateMemberDraft(member.id, {
                                            deckWriteMode: event.target.value as DeckPermissionMode,
                                            deckWriteDeckIds:
                                              event.target.value === "WHITELIST" || event.target.value === "BLACKLIST"
                                                ? getMemberDraft(member).deckWriteDeckIds
                                                : []
                                          })
                                        }
                                        className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none"
                                      >
                                        {DECK_PERMISSION_MODE_OPTIONS.map((option) => (
                                          <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                      </select>
                                    </label>
                                  </div>

                                  {getMemberDraft(member).deckReadMode === "WHITELIST" ||
                                  getMemberDraft(member).deckReadMode === "BLACKLIST" ? (
                                    <div>
                                      <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                                        Read {getMemberDraft(member).deckReadMode === "WHITELIST" ? "Whitelist" : "Blacklist"}
                                      </p>
                                      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                                        {allDecks.map((deck) => {
                                          const selected = getMemberDraft(member).deckReadDeckIds.includes(deck.id);

                                          return (
                                            <label key={`read-${member.id}-${deck.id}`} className="flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-2 py-1.5">
                                              <input
                                                type="checkbox"
                                                checked={selected}
                                                onChange={() => toggleDeckId(member.id, "deckReadDeckIds", deck.id)}
                                                className="h-3.5 w-3.5"
                                              />
                                              <span className="truncate text-xs text-slate-200">{deck.label}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ) : null}

                                  {getMemberDraft(member).deckWriteMode === "WHITELIST" ||
                                  getMemberDraft(member).deckWriteMode === "BLACKLIST" ? (
                                    <div>
                                      <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                                        Write {getMemberDraft(member).deckWriteMode === "WHITELIST" ? "Whitelist" : "Blacklist"}
                                      </p>
                                      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                                        {allDecks.map((deck) => {
                                          const selected = getMemberDraft(member).deckWriteDeckIds.includes(deck.id);

                                          return (
                                            <label key={`write-${member.id}-${deck.id}`} className="flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-2 py-1.5">
                                              <input
                                                type="checkbox"
                                                checked={selected}
                                                onChange={() => toggleDeckId(member.id, "deckWriteDeckIds", deck.id)}
                                                className="h-3.5 w-3.5"
                                              />
                                              <span className="truncate text-xs text-slate-200">{deck.label}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ) : null}

                                  <div className="flex justify-end">
                                    <Button
                                      onClick={() => void handleSaveMemberPermissions(member)}
                                      disabled={savingMemberId === member.id}
                                      className="min-w-32"
                                    >
                                      {savingMemberId === member.id ? "Saving..." : "Save Permissions"}
                                    </Button>
                                  </div>
                                </>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      ))}

                      {members.length === 0 && !isLoadingMembers ? (
                        <p className="rounded-xl border border-dashed border-white/20 bg-slate-800/50 px-4 py-6 text-center text-sm text-slate-300">
                          No additional members yet. Invite someone using their user code.
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {tab === "activity" ? (
              <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-white/15 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-800/70 p-5 md:p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Activity</p>
                      <h2 className="mt-2 font-display text-2xl font-semibold text-white">Project timeline</h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Persistent audit events with actor snapshots and field-level changes.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 p-1">
                      {ACTIVITY_FILTERS.map((filter) => (
                        <button
                          key={filter.value}
                          type="button"
                          onClick={() => {
                            setActivityFilter(filter.value);
                            setActivityLimit(30);
                          }}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                            activityFilter === filter.value
                              ? "bg-sky-500/20 text-sky-100"
                              : "text-slate-300 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.15em] text-slate-400">Total events</p>
                      <p className="mt-1 text-2xl font-semibold text-white">{activityTotal}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.15em] text-slate-400">Last 7 days</p>
                      <p className="mt-1 text-2xl font-semibold text-white">{activityWeekCount}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.15em] text-slate-400">Visible events</p>
                      <p className="mt-1 text-2xl font-semibold text-white">{filteredActivity.length}</p>
                    </div>
                  </div>
                </div>

                {activityError ? (
                  <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {activityError}
                  </div>
                ) : null}

                {isLoadingActivity && filteredActivity.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-slate-800/20 px-4 py-10 text-center">
                    <h3 className="text-lg font-semibold text-white">Loading activity</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Pulling durable audit events for this project.
                    </p>
                  </div>
                ) : null}

                {filteredActivity.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(10.5rem,1fr))] sm:[grid-template-columns:repeat(auto-fill,minmax(11.5rem,1fr))]">
                      {filteredActivity.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => setSelectedActivityEvent(entry)}
                          className="group relative flex aspect-square flex-col overflow-hidden rounded-[1.2rem] border border-white/15 bg-[linear-gradient(180deg,rgba(20,28,45,0.94),rgba(12,18,32,0.97))] p-3.5 text-left shadow-[2px_4px_0_1px_rgba(0,0,0,0.34),5px_8px_0_1px_rgba(0,0,0,0.2)] transition hover:-translate-y-1 hover:shadow-[2px_6px_0_1px_rgba(0,0,0,0.45),5px_10px_0_1px_rgba(0,0,0,0.28)]"
                        >
                          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/5 blur-2xl" />

                          <div className="mb-1.5 flex items-start justify-between gap-2">
                            <div className="rounded-lg border border-white/20 bg-white/10 p-1.5">
                              {entry.entityType === "card" ? (
                                <Sparkles className="h-4 w-4 text-sky-200" />
                              ) : entry.entityType === "deck" ? (
                                <Layers3 className="h-4 w-4 text-amber-200" />
                              ) : entry.entityType === "member" ? (
                                <Users className="h-4 w-4 text-fuchsia-200" />
                              ) : (
                                <Trophy className="h-4 w-4 text-emerald-200" />
                              )}
                            </div>

                            <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${getActivityAccentClass(entry.entityType)}`}>
                              {entry.entityType}
                            </span>
                          </div>

                          <p className="line-clamp-3 text-sm font-semibold leading-snug text-white">{entry.summary}</p>
                          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
                            By {entry.actor.displayName}
                          </p>

                          <div className="mt-2 text-xs text-slate-300/90">
                            <p className="truncate">{getActivityActionLabel(entry)}</p>
                            <p className="truncate">{entry.changes.length} field changes</p>
                          </div>

                          <div className="mt-auto pt-2.5 space-y-1">
                            <div className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300">
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatActivityAge(entry.createdAt)}
                            </div>
                            <p className="truncate text-[11px] text-slate-500">{formatActivityTime(entry.createdAt)}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {filteredActivityTotal > filteredActivity.length ? (
                      <div className="flex justify-center pt-1">
                        <Button variant="outline" onClick={() => setActivityLimit((current) => current + 20)}>
                          <PencilLine className="mr-1 h-4 w-4" />
                          Load More
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-slate-800/20 px-4 py-10 text-center">
                    <h3 className="text-lg font-semibold text-white">No matching activity yet</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Audit rows will appear here as cards, decks, projects, and member settings change.
                    </p>
                  </div>
                )}
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

            <Modal
              isOpen={selectedActivityEvent !== null}
              title={selectedActivityEvent?.summary ?? "Activity Event"}
              description={
                selectedActivityEvent
                  ? `${formatActivityTime(selectedActivityEvent.createdAt)} • by ${selectedActivityEvent.actor.displayName}`
                  : undefined
              }
              onClose={() => setSelectedActivityEvent(null)}
            >
              {selectedActivityEvent ? (
                <div className="space-y-4">
                  <div className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Entity</p>
                      <p className="mt-1 text-sm font-semibold text-white">{selectedActivityEvent.entityType}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Action</p>
                      <p className="mt-1 text-sm font-semibold text-white">{selectedActivityEvent.action.replace(/_/g, " ")}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Actor</p>
                      <p className="mt-1 text-sm font-semibold text-white">{selectedActivityEvent.actor.displayName}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">When</p>
                      <p className="mt-1 text-sm font-semibold text-white">{formatActivityAge(selectedActivityEvent.createdAt)}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <h4 className="text-sm font-semibold text-white">Change Details</h4>
                    {selectedActivityEvent.changes.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-400">No field-level changes were recorded for this event.</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {selectedActivityEvent.changes.map((change) => (
                          <div key={`${selectedActivityEvent.id}-${change.field}`} className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">{change.label}</p>
                            <p className="mt-1 text-xs text-slate-400">Before: {formatActivityValue(change.before)}</p>
                            <p className="mt-0.5 text-xs text-slate-200">After: {formatActivityValue(change.after)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </Modal>
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
