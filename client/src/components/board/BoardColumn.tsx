import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";

import { Button } from "../ui/Button";
import { TaskCard } from "../cards/TaskCard";
import type { Card } from "../../types/api";
import { columnLabels, type BoardColumnId } from "../../utils/board";

type BoardColumnProps = {
  columnId: BoardColumnId;
  cards: Card[];
  onCreateCard: () => void;
  onSelectCard: (card: Card) => void;
};

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

export const BoardColumn = ({ columnId, cards, onCreateCard, onSelectCard }: BoardColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({ id: columnId });
  const isDarkMode = !document.documentElement.hasAttribute("data-theme") || 
                     document.documentElement.getAttribute("data-theme") === "dark";

  const sortedCards = [...cards].sort((a, b) => {
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

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-[32rem] min-w-[18rem] flex-1 flex-col rounded-[2rem] border p-4 transition ${
        isDarkMode
          ? `border-white/[0.22] bg-slate-700/50 ${isOver ? "border-sky-300/60 bg-slate-700/70" : ""}`
          : `border-slate-200 bg-slate-50 ${isOver ? "border-blue-300/60 bg-blue-50" : ""}`
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className={`text-xs uppercase tracking-[0.3em] ${
            isDarkMode ? "text-slate-400" : "text-slate-500"
          }`}>Column</p>
          <h2 className={`font-display text-xl font-semibold ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}>{columnLabels[columnId]}</h2>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs ${
          isDarkMode
            ? "border-white/10 text-slate-300"
            : "border-slate-300 text-slate-600"
        }`}>{cards.length}</span>
      </div>
      <Button variant="outline" className="mb-4 gap-2" onClick={onCreateCard}>
        <Plus className="h-4 w-4" />
        Add Card
      </Button>
      <div className="flex flex-1 flex-col gap-4">
        {sortedCards.map((card) => (
          <TaskCard key={card.id} card={card} onSelect={onSelectCard} />
        ))}
        {cards.length === 0 ? (
          <div className={`flex flex-1 items-center justify-center rounded-3xl border border-dashed px-4 text-center text-sm ${
            isDarkMode
              ? "border-white/25 bg-slate-700/40 text-slate-300"
              : "border-slate-300 bg-slate-100 text-slate-600"
          }`}>
            Drop a card here or create a new one.
          </div>
        ) : null}
      </div>
    </section>
  );
};
