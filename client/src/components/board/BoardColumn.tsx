import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";

import { Button } from "../ui/Button";
import { TaskCard } from "../cards/TaskCard";
import type { Card, CardStatus } from "../../types/api";
import { columnLabels } from "../../utils/board";

type BoardColumnProps = {
  status: CardStatus;
  cards: Card[];
  onCreateCard: (status: CardStatus) => void;
  onSelectCard: (card: Card) => void;
};

export const BoardColumn = ({ status, cards, onCreateCard, onSelectCard }: BoardColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-[32rem] min-w-[18rem] flex-1 flex-col rounded-[2rem] border border-white/8 bg-slate-900/70 p-4 transition ${isOver ? "border-sky-300/40 bg-slate-900" : ""}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Column</p>
          <h2 className="font-display text-xl font-semibold text-white">{columnLabels[status]}</h2>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">{cards.length}</span>
      </div>
      <Button variant="outline" className="mb-4 gap-2" onClick={() => onCreateCard(status)}>
        <Plus className="h-4 w-4" />
        Add Card
      </Button>
      <div className="flex flex-1 flex-col gap-4">
        {cards.map((card) => (
          <TaskCard key={card.id} card={card} onSelect={onSelectCard} />
        ))}
        {cards.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/40 px-4 text-center text-sm text-slate-500">
            Drop a card here or create a new one.
          </div>
        ) : null}
      </div>
    </section>
  );
};
