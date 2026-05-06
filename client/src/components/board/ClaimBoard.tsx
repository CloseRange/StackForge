import { DndContext, type DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDownToLine,
  Bug,
  Eye,
  Layers3,
  Lock,
  Plus,
  Trophy,
  Zap
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { Button } from "../ui/Button";
import type { Card, CardPriority, Deck, UpdateCardInput, User } from "../../types/api";

const BOARD_SLOT_COUNT = 8;

const priorityLabels: Record<CardPriority, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary"
};

const priorityClasses: Record<CardPriority, string> = {
  common: "border-slate-300/20 bg-slate-900/80 text-slate-200",
  uncommon: "border-emerald-300/30 bg-emerald-500/15 text-emerald-100",
  rare: "border-sky-300/30 bg-sky-500/15 text-sky-100",
  legendary: "border-amber-300/30 bg-amber-500/15 text-amber-100"
};

const deckToneClasses = {
  teal: "from-teal-300/25 via-slate-950 to-slate-950 text-teal-100 border-teal-300/25",
  cyan: "from-cyan-300/25 via-slate-950 to-slate-950 text-cyan-100 border-cyan-300/25",
  amber: "from-amber-300/25 via-slate-950 to-slate-950 text-amber-100 border-amber-300/25",
  rose: "from-rose-300/25 via-slate-950 to-slate-950 text-rose-100 border-rose-300/25",
  indigo: "from-indigo-300/25 via-slate-950 to-slate-950 text-indigo-100 border-indigo-300/25",
  emerald: "from-emerald-300/25 via-slate-950 to-slate-950 text-emerald-100 border-emerald-300/25"
} as const;

type ClaimBoardProps = {
  cards: Card[];
  decks: Deck[];
  currentUser: User;
  onCreateCard: () => void;
  onSelectCard: (card: Card) => void;
  onUpdateCard: (cardId: string, payload: UpdateCardInput) => Promise<void>;
};

type DeckPresentation = {
  label: string;
  detail: string;
  mark: ReactNode;
  toneClass: string;
};

type BoardCardProps = {
  card: Card;
  currentUser: User;
  deckPresentation: DeckPresentation;
  dragSource: "board" | "pool";
  draggable: boolean;
  isLocked: boolean;
  isBusy: boolean;
  onSelectCard: (card: Card) => void;
  actionLabel?: string;
  onAction?: (card: Card) => void;
};

const formatDifficulty = (difficulty: Card["difficulty"]) =>
  difficulty.slice(0, 1).toUpperCase() + difficulty.slice(1);

const parseDragCardId = (id: string) => {
  if (!id.startsWith("card-")) {
    return null;
  }

  const body = id.slice(5);
  const lastDashIndex = body.lastIndexOf("-");

  if (lastDashIndex === -1) {
    return body;
  }

  return body.slice(0, lastDashIndex);
};

const getDisplayName = (user: User) => user.displayName?.trim() || user.email || "You";

const getInitial = (value: string) => value.trim().slice(0, 1).toUpperCase() || "?";

const getDeckPresentation = (card: Card, decks: Deck[]): DeckPresentation => {
  const deck = decks.find((entry) => entry.id === card.deckId);

  if (deck?.systemKey === "DEBUG") {
    return {
      label: deck.name,
      detail: deck.description || "Debug deck",
      mark: <Bug className="h-7 w-7" />,
      toneClass: deckToneClasses[deck.color]
    };
  }

  if (deck?.systemKey === "COMPLETED") {
    return {
      label: deck.name,
      detail: deck.description || "Completed deck",
      mark: <Trophy className="h-7 w-7" />,
      toneClass: deckToneClasses[deck.color]
    };
  }

  if (deck) {
    return {
      label: deck.name,
      detail: deck.description || "Custom deck",
      mark: deck.icon ? (
        <span className="text-lg font-semibold uppercase tracking-[0.18em]">{deck.icon.slice(0, 2)}</span>
      ) : (
        <Layers3 className="h-7 w-7" />
      ),
      toneClass: deckToneClasses[deck.color]
    };
  }

  return {
    label: "General",
    detail: "General deck",
    mark: <Layers3 className="h-7 w-7" />,
    toneClass: "from-slate-300/20 via-slate-950 to-slate-950 text-slate-100 border-white/15"
  };
};

const cardSortWeight = (card: Card, currentUserId: string) => {
  if (card.assigneeId === currentUserId) {
    return 0;
  }

  if (!card.assigneeId) {
    return 1;
  }

  return 2;
};

const BoardSlot = ({ id, index, children }: { id: string; index: number; children?: ReactNode }) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`relative w-full max-w-[7.75rem] sm:max-w-[8rem] lg:max-w-[8.25rem] aspect-[2/3] rounded-[1.5rem] border border-dashed p-1 transition ${
        isOver
          ? "border-sky-300/60 bg-sky-500/12 shadow-[0_0_0_1px_rgba(125,211,252,0.2)]"
          : "border-white/8 bg-white/[0.02]"
      }`}
    >
      {children ? (
        children
      ) : (
        <div className="flex h-full flex-col justify-between rounded-[1.2rem] border border-white/5 bg-slate-950/60 px-3 py-3.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.45em] text-slate-500">
            Slot {index + 1}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300">Drop A Card</p>
            <p className="mt-1 text-xs leading-4 text-slate-500">
              Claim this work onto your board. Claimed cards lock to their current owner.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const CardPoolDropZone = ({ children }: { children: ReactNode }) => {
  const { isOver, setNodeRef } = useDroppable({ id: "card-pool" });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-[1.6rem] border p-3 transition ${
        isOver ? "border-sky-300/45 bg-sky-500/10" : "border-white/8 bg-slate-900/45"
      }`}
    >
      {children}
    </div>
  );
};

const BoardCard = ({
  card,
  currentUser,
  deckPresentation,
  dragSource,
  draggable,
  isLocked,
  isBusy,
  onSelectCard,
  actionLabel,
  onAction
}: BoardCardProps) => {
  const DETAIL_PANEL_WIDTH = 224;
  const DETAIL_PANEL_GUTTER = 24;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `card-${card.id}-${dragSource}`,
    disabled: !draggable || isBusy
  });
  const [detailSide, setDetailSide] = useState<"left" | "right">("right");

  const ownerName = card.assigneeId === currentUser.id ? getDisplayName(currentUser) : "Claimed";
  const ownerInitial = card.assigneeId === currentUser.id ? getInitial(ownerName) : "?";
  const transformStyle = transform ? CSS.Translate.toString(transform) : undefined;

  const handleCardHover = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const spaceOnRight = window.innerWidth - bounds.right;
    const hasRoomOnRight = spaceOnRight >= DETAIL_PANEL_WIDTH + DETAIL_PANEL_GUTTER;

    setDetailSide(hasRoomOnRight ? "right" : "left");
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: transformStyle, zIndex: isDragging ? 50 : undefined }}
      className="group/card relative z-0 overflow-visible hover:z-[70]"
      onMouseEnter={handleCardHover}
    >
      <button
        type="button"
        onClick={() => onSelectCard(card)}
        className={`relative block w-full text-left ${draggable && !isBusy ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
        {...(draggable && !isBusy ? listeners : {})}
        {...(draggable && !isBusy ? attributes : {})}
      >
        <div
          className={`relative aspect-[2/3] rounded-[1.35rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(10,15,29,0.96))] p-2.5 shadow-[0_18px_45px_rgba(2,6,23,0.38)] transition duration-300 ${
            deckPresentation.toneClass
          } ${isLocked ? "opacity-80" : ""} ${isDragging ? "scale-[1.03]" : "group-hover/card:-translate-y-2 group-hover/card:rotate-[2deg] group-hover/card:shadow-[0_38px_90px_rgba(2,6,23,0.6)]"}`}
        >
          <div className="absolute left-1/2 top-3 -translate-x-1/2 text-center text-white">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/20 shadow-inner shadow-black/25">
              {deckPresentation.mark}
            </div>
            <div className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.3em] text-white/60">
              {deckPresentation.label}
            </div>
          </div>

          <div className={`absolute right-2.5 top-2.5 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] ${priorityClasses[card.priority]}`}>
            {priorityLabels[card.priority]}
          </div>

          <div className={`absolute bottom-2.5 right-2.5 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] ${priorityClasses[card.priority]}`}>
            {priorityLabels[card.priority]}
          </div>

          {isLocked ? (
            <div className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-rose-300/25 bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-rose-100">
              <Lock className="h-3 w-3" />
              Locked
            </div>
          ) : null}

          <div className="absolute inset-x-3 bottom-8">
            <div className="px-1">
              <div className="text-[9px] uppercase tracking-[0.28em] text-white/50">Card</div>
              <h3 className="mt-1 line-clamp-3 text-sm font-semibold leading-snug text-white">{card.title}</h3>
            </div>
          </div>

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-slate-950 bg-gradient-to-br from-sky-300 to-cyan-500 text-sm font-semibold text-slate-950 shadow-[0_10px_20px_rgba(14,165,233,0.28)]">
              {ownerInitial}
            </div>
          </div>
        </div>
      </button>

      {!isDragging ? (
        <div
          className={`pointer-events-none absolute top-1/2 hidden w-56 -translate-y-1/2 opacity-0 transition duration-200 lg:block group-hover/card:pointer-events-auto group-hover/card:opacity-100 ${
            detailSide === "right"
              ? "left-full translate-x-2 group-hover/card:translate-x-4"
              : "right-full -translate-x-2 group-hover/card:-translate-x-4"
          }`}
        >
          <div className="relative z-[80] rounded-[1.25rem] border border-white/10 bg-slate-950/96 p-3 shadow-[0_24px_64px_rgba(2,6,23,0.58)] backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Details</div>
                <div className="mt-1.5 text-sm font-semibold text-white">{card.title}</div>
              </div>
              <Eye className="mt-1 h-4 w-4 text-slate-500" />
            </div>

            <p className="mt-2.5 text-xs leading-5 text-slate-300">
              {card.description?.trim() || "No card notes yet. Open the card to add instructions and checklist items."}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-2">
                <div className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Deck</div>
                <div className="mt-1 font-semibold text-white">{deckPresentation.label}</div>
              </div>
              <div className="rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-2">
                <div className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Owner</div>
                <div className="mt-1 font-semibold text-white">{ownerName}</div>
              </div>
              <div className="rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-2">
                <div className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Difficulty</div>
                <div className="mt-1 font-semibold text-white">{formatDifficulty(card.difficulty)}</div>
              </div>
              <div className="rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-2">
                <div className="text-[10px] uppercase tracking-[0.28em] text-slate-500">XP</div>
                <div className="mt-1 font-semibold text-white">{card.xpValue}</div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {card.tags.length > 0 ? (
                card.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-slate-300">
                    #{tag}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-slate-500">
                  No tags yet
                </span>
              )}
            </div>

            {onAction && actionLabel ? (
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onAction(card);
                }}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <ArrowDownToLine className="h-4 w-4" />
                {actionLabel}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const ClaimBoard = ({
  cards,
  decks,
  currentUser,
  onCreateCard,
  onSelectCard,
  onUpdateCard
}: ClaimBoardProps) => {
  const [notice, setNotice] = useState<string | null>(null);
  const [busyCardId, setBusyCardId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const activeBoardCards = useMemo(
    () =>
      cards
        .filter((card) => card.assigneeId === currentUser.id)
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()),
    [cards, currentUser.id]
  );

  const visibleBoardCards = activeBoardCards.slice(0, BOARD_SLOT_COUNT);
  const overflowBoardCount = Math.max(activeBoardCards.length - BOARD_SLOT_COUNT, 0);

  const sortedPoolCards = useMemo(
    () =>
      [...cards].sort((left, right) => {
        const weightDifference = cardSortWeight(left, currentUser.id) - cardSortWeight(right, currentUser.id);

        if (weightDifference !== 0) {
          return weightDifference;
        }

        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      }),
    [cards, currentUser.id]
  );

  const mutateCard = async (cardId: string, payload: UpdateCardInput, nextNotice?: string) => {
    setBusyCardId(cardId);

    try {
      await onUpdateCard(cardId, payload);
      setNotice(nextNotice ?? null);
    } finally {
      setBusyCardId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const overId = event.over?.id;

    if (!overId || typeof overId !== "string") {
      return;
    }

    const cardId = parseDragCardId(String(event.active.id));

    if (!cardId) {
      return;
    }

    const card = cards.find((entry) => entry.id === cardId);

    if (!card || busyCardId) {
      return;
    }

    if (card.assigneeId && card.assigneeId !== currentUser.id) {
      setNotice("That card is already claimed on someone else’s board.");
      return;
    }

    const isAlreadyOnBoard = card.assigneeId === currentUser.id;

    if (overId.startsWith("board-slot-")) {
      if (!isAlreadyOnBoard && visibleBoardCards.length >= BOARD_SLOT_COUNT) {
        setNotice("Your board is full. Release a card before claiming another one.");
        return;
      }

      await mutateCard(card.id, { assigneeId: currentUser.id }, "Card claimed onto your board.");
      return;
    }

    if (overId === "card-pool" && card.assigneeId === currentUser.id) {
      await mutateCard(card.id, { assigneeId: null }, "Card returned to the shared pool.");
    }
  };

  return (
    <DndContext
      onDragStart={(event) => setActiveDragId(String(event.active.id))}
      onDragCancel={() => setActiveDragId(null)}
      onDragEnd={(event) => {
        void (async () => {
          try {
            await handleDragEnd(event);
          } finally {
            setActiveDragId(null);
          }
        })();
      }}
    >
      <div className={`space-y-4 overflow-x-hidden ${activeDragId ? "overflow-y-hidden" : ""}`}>
        <section className="rounded-[1.6rem] border border-white/8 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))] p-4 md:p-4.5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-sky-300">Your Playmat</p>
              <h2 className="mt-1.5 font-display text-2xl font-semibold text-white">Eight active slots</h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-300">
                Drag a card from the collection below onto an empty slot to claim it to your board. Once claimed,
                that card stays locked to its current owner until it is released back to the pool.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <div className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Active</div>
                <div className="mt-1 text-xl font-semibold text-white">{visibleBoardCards.length}/8</div>
              </div>
              <Button onClick={onCreateCard} className="gap-2 self-start">
                <Plus className="h-4 w-4" />
                Forge Card
              </Button>
            </div>
          </div>

          {notice ? (
            <div className="mt-4 rounded-xl border border-sky-300/18 bg-sky-500/10 px-3 py-2.5 text-sm text-sky-100">
              {notice}
            </div>
          ) : null}

          {overflowBoardCount > 0 ? (
            <div className="mt-4 rounded-xl border border-amber-300/18 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100">
              {overflowBoardCount} extra claimed card{overflowBoardCount === 1 ? " is" : "s are"} off the visible board.
              Release cards to get back under the 8-slot limit.
            </div>
          ) : null}

          <div className="mt-4">
            <div className="grid justify-center gap-1.5 [grid-template-columns:repeat(auto-fit,minmax(7.75rem,7.75rem))] sm:gap-2 sm:[grid-template-columns:repeat(auto-fit,minmax(8rem,8rem))] lg:[grid-template-columns:repeat(auto-fit,minmax(8.25rem,8.25rem))]">
              {Array.from({ length: BOARD_SLOT_COUNT }, (_, index) => {
                const card = visibleBoardCards[index];

                return (
                  <BoardSlot key={index} id={`board-slot-${index}`} index={index}>
                    {card ? (
                      <BoardCard
                        card={card}
                        currentUser={currentUser}
                        deckPresentation={getDeckPresentation(card, decks)}
                        dragSource="board"
                        draggable
                        isLocked={false}
                        isBusy={busyCardId === card.id}
                        onSelectCard={onSelectCard}
                        actionLabel="Return To Pool"
                        onAction={(selectedCard) =>
                          void mutateCard(selectedCard.id, { assigneeId: null }, "Card returned to the shared pool.")
                        }
                      />
                    ) : null}
                  </BoardSlot>
                );
              })}
            </div>
          </div>
        </section>

        <CardPoolDropZone>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.38em] text-slate-500">Card Library</p>
              <h3 className="mt-1.5 font-display text-xl font-semibold text-white">Every card in the project</h3>
              <p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-400">
                Unclaimed cards can be dragged onto your board. Cards already claimed by another user stay visible
                here, but they are locked until released by their owner.
              </p>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-300">
              <Zap className="h-4 w-4 text-amber-300" />
              Drop one of your claimed cards back here to release it.
            </div>
          </div>

          {sortedPoolCards.length === 0 ? (
            <div className="mt-4 rounded-[1.25rem] border border-dashed border-white/8 bg-slate-950/40 px-4 py-8 text-center">
              <div className="font-semibold text-white">No cards yet</div>
              <p className="mt-2 text-sm text-slate-500">Forge the first card to populate the shared library.</p>
            </div>
          ) : (
            <div className="mt-4 grid justify-center gap-2 [grid-template-columns:repeat(auto-fill,minmax(7.75rem,7.75rem))] sm:[grid-template-columns:repeat(auto-fill,minmax(8.25rem,8.25rem))] lg:[grid-template-columns:repeat(auto-fill,minmax(8.75rem,8.75rem))]">
              {sortedPoolCards.map((card) => {
                const isLocked = Boolean(card.assigneeId && card.assigneeId !== currentUser.id);

                return (
                  <BoardCard
                    key={card.id}
                    card={card}
                    currentUser={currentUser}
                    deckPresentation={getDeckPresentation(card, decks)}
                    dragSource="pool"
                    draggable={!isLocked}
                    isLocked={isLocked}
                    isBusy={busyCardId === card.id}
                    onSelectCard={onSelectCard}
                    actionLabel={card.assigneeId === currentUser.id ? "Return To Pool" : undefined}
                    onAction={
                      card.assigneeId === currentUser.id
                        ? (selectedCard) =>
                            void mutateCard(selectedCard.id, { assigneeId: null }, "Card returned to the shared pool.")
                        : undefined
                    }
                  />
                );
              })}
            </div>
          )}
        </CardPoolDropZone>
      </div>
    </DndContext>
  );
};