import { DndContext, type DragEndEvent } from "@dnd-kit/core";

import { BoardColumn } from "./BoardColumn";
import type { Card, CardStatus } from "../../types/api";
import { columnOrder } from "../../utils/board";

type BoardViewProps = {
  cards: Card[];
  onMoveCard: (cardId: string, status: CardStatus) => Promise<void>;
  onCreateCard: (status: CardStatus) => void;
  onSelectCard: (card: Card) => void;
};

export const BoardView = ({ cards, onMoveCard, onCreateCard, onSelectCard }: BoardViewProps) => {
  const handleDragEnd = (event: DragEndEvent) => {
    const overId = event.over?.id;

    if (!overId || typeof overId !== "string") {
      return;
    }

    void onMoveCard(String(event.active.id), overId as CardStatus);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columnOrder.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            cards={cards.filter((card) => card.status === status)}
            onCreateCard={onCreateCard}
            onSelectCard={onSelectCard}
          />
        ))}
      </div>
    </DndContext>
  );
};
