import { useEffect, useMemo, useState } from "react";
import { BookText, Save } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { useBoardStore } from "../../hooks/useBoardStore";
import { projectService } from "../../services/projectService";
import { Button } from "../ui/Button";

const MAX_NOTE_LENGTH = 10_000;

export const ProjectNotesSidebar = () => {
  const { token } = useAuth();
  const {
    projects,
    selectedProjectId,
    clearError
  } = useBoardStore();

  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [isLoadingNote, setIsLoadingNote] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  useEffect(() => {
    if (!token || !selectedProjectId) {
      setContent("");
      setSavedContent("");
      setNoteError(null);
      setLastSavedAt(null);
      return;
    }

    let isCancelled = false;
    setIsLoadingNote(true);
    setNoteError(null);

    void projectService
      .getMyNote(token, selectedProjectId)
      .then((note) => {
        if (isCancelled) {
          return;
        }

        setContent(note.content);
        setSavedContent(note.content);
        setLastSavedAt(note.updatedAt);
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        setNoteError(error instanceof Error ? error.message : "Failed to load notes");
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingNote(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [token, selectedProjectId]);

  const hasUnsavedChanges = content !== savedContent;

  const handleSave = async () => {
    if (!token || !selectedProjectId) {
      return;
    }

    setIsSavingNote(true);
    setNoteError(null);

    try {
      const saved = await projectService.upsertMyNote(token, selectedProjectId, content);
      setContent(saved.content);
      setSavedContent(saved.content);
      setLastSavedAt(saved.updatedAt);
      clearError();
    } catch (error: unknown) {
      setNoteError(error instanceof Error ? error.message : "Failed to save notes");
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-5 overflow-hidden">
      <div>
        <p className="text-xs uppercase tracking-[0.34em] text-sky-300">Notes</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-white">Personal project notes</h2>
        <p className="mt-2 text-sm text-slate-400">
          Notes are private to your account and change per selected project.
        </p>
      </div>

      <Button
        className="w-full"
        onClick={() => void handleSave()}
        disabled={!activeProject || isLoadingNote || isSavingNote || !hasUnsavedChanges}
      >
        <span className="inline-flex items-center gap-2">
          <Save className="h-4 w-4" />
          {isSavingNote ? "Saving..." : "Save Notes"}
        </span>
      </Button>

      <div className="flex flex-1 flex-col overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <BookText className="h-4 w-4 text-amber-300" />
          {activeProject ? `${activeProject.name} notes` : "Select a project"}
        </div>

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value.slice(0, MAX_NOTE_LENGTH))}
          placeholder={
            activeProject
              ? "Write thoughts, reminders, and blockers for this project..."
              : "Select a project to start writing notes."
          }
          disabled={!activeProject || isLoadingNote}
          className="min-h-[220px] flex-1 resize-none overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />

        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-400">
          <span>{content.length}/{MAX_NOTE_LENGTH}</span>
          <span>
            {isLoadingNote
              ? "Loading note..."
              : hasUnsavedChanges
                ? "Unsaved changes"
                : lastSavedAt
                  ? `Saved ${new Date(lastSavedAt).toLocaleString()}`
                  : "Not saved yet"}
          </span>
        </div>

        {noteError ? (
          <p className="mt-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {noteError}
          </p>
        ) : null}
      </div>
    </div>
  );
};
