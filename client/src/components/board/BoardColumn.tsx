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

export const BoardColumn = ({ columnId, cards, onCreateCard, onSelectCard }: BoardColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({ id: columnId });

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-[32rem] min-w-[18rem] flex-1 flex-col rounded-[2rem] border border-white/[0.12] bg-slate-800/50 p-4 transition ${isOver ? "border-sky-300/50 bg-slate-800/70" : ""}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Column</p>
          <h2 className="font-display text-xl font-semibold text-white">{columnLabels[columnId]}</h2>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">{cards.length}</span>
      </div>
      <Button variant="outline" className="mb-4 gap-2" onClick={onCreateCard}>
        <Plus className="h-4 w-4" />
        Add Card
      </Button>
      <div className="flex flex-1 flex-col gap-4">
        {cards.map((card) => (
          <TaskCard key={card.id} card={card} onSelect={onSelectCard} />
        ))}
        {cards.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-white/15 bg-slate-800/30 px-4 text-center text-sm text-slate-400">
            Drop a card here or create a new one.
          </div>
        ) : null}
      </div>
    </section>
  );
};
