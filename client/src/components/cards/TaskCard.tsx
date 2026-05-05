import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Bug, FilePenLine, FlaskConical, ScrollText, Sparkles, Zap } from "lucide-react";

import type { Card } from "../../types/api";
import { rarityClasses } from "../../utils/board";

const typeIcons = {
  feature: Sparkles,
  bug: Bug,
  refactor: FilePenLine,
  docs: ScrollText,
  test: FlaskConical
};

type TaskCardProps = {
  card: Card;
  onSelect: (card: Card) => void;
};

export const TaskCard = ({ card, onSelect }: TaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });
  const Icon = typeIcons[card.type];
  const assigneeLabel = card.assigneeId ? `User ${card.assigneeId.slice(0, 6)}` : "Unassigned";
  const assigneeInitial = assigneeLabel.slice(0, 1).toUpperCase();

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onSelect(card)}
      className={`group w-full rounded-3xl border bg-slate-950/80 p-4 text-left shadow-xl transition hover:-translate-y-0.5 ${rarityClasses[card.priority]} ${isDragging ? "opacity-70" : "opacity-100"}`}
      style={{
        transform: CSS.Translate.toString(transform)
      }}
      {...listeners}
      {...attributes}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-slate-400">
          <Icon className="h-4 w-4 text-sky-300" />
          <span>{card.type}</span>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-xs font-semibold text-amber-200">
          <Zap className="h-3.5 w-3.5" />
          {card.xpValue} XP
        </div>
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold text-white">{card.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-slate-400">{card.description || "No description yet."}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {card.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-300">
            #{tag}
          </span>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between">
        <div className="text-xs text-slate-500">Difficulty {card.difficulty}</div>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white">
            {assigneeInitial}
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>{assigneeLabel}</div>
            <div>{card.priority}</div>
          </div>
        </div>
      </div>
    </button>
  );
};
