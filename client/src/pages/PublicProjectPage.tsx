import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Globe, Layers3, Zap } from "lucide-react";

import type { PublicProjectData } from "../services/publicApiService";
import { publicApiService } from "../services/publicApiService";
import type { Card, Deck } from "../types/api";

const rarityClasses: Record<string, { text: string }> = {
  common:    { text: "text-slate-400" },
  uncommon:  { text: "text-emerald-300" },
  rare:      { text: "text-sky-300" },
  legendary: { text: "text-amber-300" }
};

const deckBorderClasses: Record<string, string> = {
  teal:    "border-teal-400/60",
  cyan:    "border-cyan-400/60",
  amber:   "border-amber-400/60",
  rose:    "border-rose-400/60",
  indigo:  "border-indigo-400/60",
  emerald: "border-emerald-400/60"
};

const rarityLabel = (p: string) => p.charAt(0).toUpperCase() + p.slice(1);

const priorityOrder: Record<Card["priority"], number> = {
  legendary: 0,
  rare: 1,
  uncommon: 2,
  common: 3
};

const difficultyOrder: Record<Card["difficulty"], number> = {
  easy: 0,
  medium: 1,
  hard: 2,
  epic: 3
};

const sortCardsForBoard = (items: Card[]) =>
  [...items].sort((a, b) => {
    const priorityDelta = priorityOrder[a.priority] - priorityOrder[b.priority];

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    const difficultyDelta = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];

    if (difficultyDelta !== 0) {
      return difficultyDelta;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

function PublicCard({ card, deckColor }: { card: Card; deckColor: string }) {
  const rarity = rarityClasses[card.priority] ?? { text: "text-slate-400" };
  const border = deckBorderClasses[deckColor] ?? "border-white/10";
  const completedItems = card.checklist.filter((i) => i.completed).length;
  const totalItems = card.checklist.length;

  return (
    <div className={`rounded-2xl border bg-slate-800/70 p-4 shadow-lg ${border}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className={`text-xs uppercase tracking-[0.28em] font-semibold ${rarity.text}`}>
          {rarityLabel(card.priority)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs font-semibold text-amber-200">
          <Zap className="h-3 w-3" />
          {card.xpValue} XP
        </span>
      </div>

      <h3 className="font-semibold text-white leading-snug">{card.title}</h3>

      {card.description ? (
        <p className="mt-1.5 line-clamp-3 text-sm text-slate-400">{card.description}</p>
      ) : null}

      {card.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {card.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      {totalItems > 0 ? (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-sky-400"
              style={{ width: `${Math.round((completedItems / totalItems) * 100)}%` }}
            />
          </div>
          <span className="whitespace-nowrap text-xs text-slate-500">
            {completedItems}/{totalItems}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function DeckColumn({ deck, cards }: { deck: Deck; cards: Card[] }) {
  return (
    <section className="flex min-w-[17rem] flex-1 flex-col rounded-[2rem] border border-white/10 bg-slate-900/50 p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          {deck.icon ? (
            <span className="text-xl leading-none">{deck.icon}</span>
          ) : (
            <Layers3 className="h-4 w-4 text-slate-400" />
          )}
          <h2 className="mt-1 font-semibold text-white">{deck.name}</h2>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-400">
          {cards.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {cards.map((card) => (
          <PublicCard key={card.id} card={card} deckColor={deck.color} />
        ))}
        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-600">
            No cards yet
          </div>
        ) : null}
      </div>
    </section>
  );
}

export const PublicProjectPage = () => {
  const { userCode, projectSlug } = useParams<{ userCode: string; projectSlug: string }>();
  const [data, setData] = useState<PublicProjectData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userCode || !projectSlug) {
      return;
    }

    setIsLoading(true);
    publicApiService
      .getProject(userCode, projectSlug)
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load project");
      })
      .finally(() => setIsLoading(false));
  }, [userCode, projectSlug]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Loading...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-center">
        <p className="text-lg font-semibold text-white">
          {error ?? "Project not found or not publicly shared."}
        </p>
        <Link to="/" className="text-sm text-sky-400 hover:underline">
          Back to StackForge
        </Link>
      </div>
    );
  }

  const { project, decks, cards } = data;

  const visibleDecks = decks.filter((d) => d.isAccessible);
  const totalXp = cards.reduce((sum, c) => sum + (c.xpValue ?? 0), 0);
  const earnedXp = cards.reduce((sum, c) => {
    const deck = decks.find((d) => d.id === c.deckId);
    return sum + Math.round((c.xpValue * (deck?.xpPayout ?? 0)) / 100);
  }, 0);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-white/5 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-6 py-3">
          <Link to="/" className="font-display text-sm font-bold text-sky-400">
            StackForge
          </Link>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <Globe className="h-3.5 w-3.5" />
            Public Project
          </div>
        </div>
      </header>

      {/* Project hero */}
      <div className="mx-auto max-w-screen-2xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold text-white md:text-4xl">{project.name}</h1>
        {project.description ? (
          <p className="mt-3 max-w-2xl text-slate-400">{project.description}</p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-400">
          <span>
            <span className="font-semibold text-white">{cards.length}</span> cards
          </span>
          <span>
            <span className="font-semibold text-amber-300">{earnedXp}</span>
            <span className="text-slate-500"> / {totalXp} XP earned</span>
          </span>
          {totalXp > 0 ? (
            <span className="flex items-center gap-2">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${Math.min(100, Math.round((earnedXp / totalXp) * 100))}%` }}
                />
              </div>
              <span>{Math.round((earnedXp / totalXp) * 100)}%</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Board columns */}
      <div className="mx-auto max-w-screen-2xl px-6 pb-16">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {visibleDecks.map((deck) => (
            <DeckColumn
              key={deck.id}
              deck={deck}
              cards={sortCardsForBoard(cards.filter((c) => c.deckId === deck.id))}
            />
          ))}
        </div>

        {visibleDecks.length === 0 ? (
          <div className="flex min-h-[20rem] items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-slate-500">
            No decks to display.
          </div>
        ) : null}
      </div>
    </div>
  );
};
