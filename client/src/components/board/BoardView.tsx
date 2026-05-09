import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";

import { BoardColumn } from "./BoardColumn";
import type { Card, User } from "../../types/api";
import { columnOrder } from "../../utils/board";

type BoardViewProps = {
  cards: Card[];
  currentUser: User;
  onCreateCard: () => void;
  onSelectCard: (card: Card) => void;
};

export const BoardView = ({ cards, currentUser, onCreateCard, onSelectCard }: BoardViewProps) => {
  const sensors = useSensors(
    // Require slight movement before drag starts so click-to-open remains reliable.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  return (
    <DndContext sensors={sensors}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columnOrder.map((columnId) => (
          <BoardColumn
            key={columnId}
            columnId={columnId}
            cards={cards.filter((card) => {
              if (columnId === "unclaimed") {
                return !card.assigneeId;
              }

              if (columnId === "mine") {
                return card.assigneeId === currentUser.id;
              }

              return Boolean(card.assigneeId && card.assigneeId !== currentUser.id);
            })}
            onCreateCard={onCreateCard}
            onSelectCard={onSelectCard}
          />
        ))}
      </div>
    </DndContext>
  );
};
