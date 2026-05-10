import { useEffect, useState } from "react";
import { ArrowLeft, Eye, Lock, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ClaimBoard } from "../components/board/ClaimBoard";
import { Header } from "../components/header/Header";
import { Button } from "../components/ui/Button";
import { ProjectIcon } from "../components/ui/ProjectIcon";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { getAllDemoData } from "../data/demoData";

type ProjectTab = "board" | "decks" | "members" | "timeline" | "activity" | "settings";

export const DemoProjectPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProjectTab>("board");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  const { owner, project, decks, cards, teamMembers } = getAllDemoData();

  const totalXp = cards.reduce((sum, c) => sum + (c.xpValue ?? 0), 0);

  const sidebar = (
    <div className="flex h-full flex-col gap-6">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to StackForge
      </button>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Eye className="h-4 w-4 text-sky-300" />
          <p className="text-xs uppercase tracking-[0.35em] text-sky-300">Demo Mode</p>
        </div>
        <h2 className="font-display text-2xl font-semibold text-white">{project.name}</h2>
        <p className="mt-2 text-sm text-slate-400">{project.description}</p>
        <div className="mt-3 rounded-lg border border-sky-300/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
          <Lock className="mb-1 inline h-3 w-3" /> This is a read-only demo project. Create your own to get started!
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Users className="h-4 w-4 text-purple-300" />
          Team Members
        </div>
        <div className="space-y-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-sm font-medium text-white">{owner.displayName}</p>
            <p className="text-xs text-slate-400">Project Owner</p>
          </div>
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
            >
              <p className="text-sm font-medium text-white">{member.displayName}</p>
              <p className="text-xs text-slate-400">{member.firstName}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Project Stats</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Total Cards</span>
            <span className="font-semibold text-white">{cards.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Decks</span>
            <span className="font-semibold text-white">{decks.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Total XP</span>
            <span className="font-semibold text-white">{totalXp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Completed</span>
            <span className="font-semibold text-white">{cards.filter(c => c.deckId === "demo-deck-complete").length}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Header
        variant="project"
        projectName={project.name}
        xp={totalXp}
        xpMax={Math.max(totalXp + 500, 2000)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <DashboardLayout sidebar={sidebar}>
        <div className="mb-4 rounded-xl border border-sky-300/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          <Eye className="mb-1 inline h-4 w-4" /> This is a demo project. Explore the board and team collaboration features
          without connecting to any databases.
        </div>

        {activeTab === "board" ? (
          <ClaimBoard
            cards={cards}
            decks={decks}
            currentUser={owner}
            maxCardsOnBoard={project.maxCardsOnBoard}
            onCreateCard={() => {
              // Demo is read-only
            }}
            onSelectCard={() => {
              // Demo is read-only
            }}
            onUpdateCard={async () => {
              // Demo is read-only
            }}
          />
        ) : null}

        {activeTab === "members" ? (
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/50 p-5">
              <h2 className="mb-4 text-lg font-semibold text-white">Team Members ({teamMembers.length + 1})</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div>
                    <p className="font-medium text-white">{owner.displayName}</p>
                    <p className="text-sm text-slate-400">{owner.email}</p>
                  </div>
                  <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-medium text-sky-100">
                    Owner
                  </span>
                </div>
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-white">{member.displayName}</p>
                      <p className="text-sm text-slate-400">{member.email}</p>
                    </div>
                    <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-100">
                      Member
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "decks" ? (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-semibold text-white">Project Decks</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {decks.map((deck) => {
                const deckCards = cards.filter((c) => c.deckId === deck.id);
                return (
                  <div
                    key={deck.id}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="mb-2 text-xs uppercase tracking-wider text-slate-400">{deck.color}</div>
                    <h3 className="text-lg font-semibold text-white">{deck.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{deck.description}</p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-slate-400">{deckCards.length} cards</span>
                      <span className="rounded bg-slate-700 px-2 py-1 text-xs font-medium text-slate-200">
                        {deck.xpPayout} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {activeTab === "activity" || activeTab === "timeline" || activeTab === "settings" ? (
          <div className="flex min-h-96 items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/30 text-center">
            <div>
              <h2 className="font-display text-xl font-semibold text-white">Coming Soon</h2>
              <p className="mt-2 text-sm text-slate-400">
                This section is not included in the demo. Sign up to unlock all features!
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate("/login")}
              >
                Get Started
              </Button>
            </div>
          </div>
        ) : null}
      </DashboardLayout>
    </>
  );
};
