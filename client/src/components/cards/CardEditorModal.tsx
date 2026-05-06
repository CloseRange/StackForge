import { useEffect, useState } from "react";

import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import type { Card, CardDifficulty, CardPriority, CreateCardInput, Deck, UpdateCardInput } from "../../types/api";

type CardEditorModalProps = {
  isOpen: boolean;
  projectId: string;
  currentUserId: string;
  decks: Deck[];
  defaultDeckId?: string;
  isAssignmentBlocked?: boolean;
  card: Card | null;
  onClose: () => void;
  onCreate: (payload: CreateCardInput) => Promise<void>;
  onUpdate: (cardId: string, payload: UpdateCardInput) => Promise<void>;
};

type ChecklistFormItem = {
  label: string;
  completed: boolean;
};

const cardPriorities: CardPriority[] = ["common", "uncommon", "rare", "legendary"];
const difficultyOptions: Array<{ value: CardDifficulty; label: string; xp: number }> = [
  { value: "easy", label: "Easy", xp: 25 },
  { value: "medium", label: "Medium", xp: 50 },
  { value: "hard", label: "Hard", xp: 100 },
  { value: "epic", label: "Epic", xp: 200 }
];

export const CardEditorModal = ({
  isOpen,
  projectId,
  currentUserId,
  decks,
  defaultDeckId,
  isAssignmentBlocked = false,
  card,
  onClose,
  onCreate,
  onUpdate
}: CardEditorModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<CardPriority>("common");
  const [difficulty, setDifficulty] = useState<CardDifficulty>("medium");
  const [deckId, setDeckId] = useState("");
  const [tags, setTags] = useState("");
  const [checklist, setChecklist] = useState<ChecklistFormItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [assignToMe, setAssignToMe] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTitle(card?.title ?? "");
    setDescription(card?.description ?? "");
    setPriority(card?.priority ?? "common");
    setDifficulty(card?.difficulty ?? "medium");
    setDeckId(card?.deckId ?? defaultDeckId ?? decks[0]?.id ?? "");
    setTags(card?.tags.join(", ") ?? "");
    setChecklist(card?.checklist.map((item) => ({ label: item.label, completed: item.completed })) ?? []);
    const defaultAssignToMe = card ? card.assigneeId === currentUserId : true;
    setAssignToMe(isAssignmentBlocked ? false : defaultAssignToMe);
    setNewChecklistItem("");
  }, [card, currentUserId, decks, defaultDeckId, isAssignmentBlocked, isOpen]);

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) {
      return;
    }

    setChecklist((current) => [...current, { label: newChecklistItem.trim(), completed: false }]);
    setNewChecklistItem("");
  };

  const submit = async () => {
    setIsSaving(true);

    const payload = {
      title,
      description,
      priority,
      difficulty,
      deckId,
      projectId,
      assigneeId: isAssignmentBlocked ? null : assignToMe ? currentUserId : null,
      tags: tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      checklist
    };

    try {
      if (card) {
        await onUpdate(card.id, payload);
      } else {
        await onCreate(payload);
      }

      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={card ? "Edit Card" : "Forge New Card"}
      description="Tune rarity, difficulty, and the current battlefield deck. XP is set automatically from difficulty."
      onClose={onClose}
    >
      <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-300 md:col-span-2">
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/40"
            placeholder="Polish drag handle states"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-300 md:col-span-2">
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-sky-300/40"
            placeholder="What needs to happen to get this card to victory?"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Priority
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as CardPriority)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
          >
            {cardPriorities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Difficulty
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as CardDifficulty)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
          >
            {difficultyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.xp} XP)
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Deck
          <select
            value={deckId}
            onChange={(event) => setDeckId(event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
          >
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-300 md:col-span-2">
          Tags
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
            placeholder="frontend, polish, sprint-3"
          />
        </label>
        <div className="md:col-span-2">
          <div className="mb-2 text-sm text-slate-300">Checklist</div>
          <div className="space-y-2 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            {checklist.map((item, index) => (
              <div key={`${item.label}-${index}`} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={(event) =>
                    setChecklist((current) =>
                      current.map((currentItem, currentIndex) =>
                        currentIndex === index
                          ? { ...currentItem, completed: event.target.checked }
                          : currentItem
                      )
                    )
                  }
                  className="h-4 w-4 rounded border-white/20 bg-white/5"
                />
                <input
                  value={item.label}
                  onChange={(event) =>
                    setChecklist((current) =>
                      current.map((currentItem, currentIndex) =>
                        currentIndex === index ? { ...currentItem, label: event.target.value } : currentItem
                      )
                    )
                  }
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none"
                />
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() =>
                    setChecklist((current) => current.filter((_, currentIndex) => currentIndex !== index))
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={newChecklistItem}
                onChange={(event) => setNewChecklistItem(event.target.value)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none"
                placeholder="Add checklist item"
              />
              <Button type="button" variant="outline" onClick={addChecklistItem}>
                Add
              </Button>
            </div>
          </div>
        </div>
        <label className="flex items-center gap-3 text-sm text-slate-300 md:col-span-2">
          <input
            type="checkbox"
            checked={assignToMe}
            onChange={(event) => setAssignToMe(event.target.checked)}
            disabled={isAssignmentBlocked}
            className="h-4 w-4 rounded border-white/20 bg-white/5"
          />
          {isAssignmentBlocked ? "Assignment disabled for this deck" : "Assign this card to me"}
        </label>
      </div>
      <div className="sticky bottom-0 -mx-1 border-t border-white/10 bg-slate-900/95 px-1 pt-4 pb-1 backdrop-blur-sm">
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={isSaving || !title.trim() || !deckId}>
            {isSaving ? "Saving..." : card ? "Save Card" : "Create Card"}
          </Button>
        </div>
      </div>
      </div>
    </Modal>
  );
};
