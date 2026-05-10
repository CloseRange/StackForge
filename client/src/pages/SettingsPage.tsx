import { useEffect, useMemo, useState } from "react";
import { Bell, Eye, KeyRound, Lock, Mail, Moon, Save } from "lucide-react";

import { Header } from "../components/header/Header";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { DashboardLayout } from "../layouts/DashboardLayout";

import type { AccountSettings } from "../types/api";

const DEFAULT_SETTINGS: AccountSettings = {
  theme: "dark",
  aliasName: "",
  emailMentions: false,
  weeklyDigest: false,
  desktopAlerts: false,
  compactBoardCards: false,
  showCardDetails: true,
  showCardPriority: true,
  priorityDisplayMode: "rarity",
  showCardDifficulty: true,
  difficultyDisplayMode: "experience",
  notifyMilestoneDueSoon: true,
  notifyMilestoneCompleted: true,
  notifyAddedToProject: true,
  notifyAssignedCardChanged: true,
  notifyProjectMemberJoined: true
};

export const SettingsPage = () => {
  const { getSettings, updateSettings, updateEmail, updatePassword, user } = useAuth();
  const [settings, setSettings] = useState<AccountSettings>(DEFAULT_SETTINGS);
  const [lastSavedSettings, setLastSavedSettings] = useState<AccountSettings>(DEFAULT_SETTINGS);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailPasswordInput, setEmailPasswordInput] = useState("");
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      setIsLoading(true);

      try {
        const persisted = await getSettings();
        const normalized = { ...persisted, theme: "dark" as const };

        if (!isMounted) {
          return;
        }

        setSettings(normalized);
        setLastSavedSettings(normalized);
      } catch {
        if (!isMounted) {
          return;
        }

        setSaveMessage("Could not load settings from server.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, [getSettings]);

  useEffect(() => {
    const root = document.documentElement;

    const applyThemePreview = () => {
      root.dataset.theme = "dark";
      root.style.colorScheme = "dark";
    };

    applyThemePreview();

    return undefined;
  }, [settings.theme]);

  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(lastSavedSettings);
  }, [lastSavedSettings, settings]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const persisted = await updateSettings({ ...settings, theme: "dark" });
      const normalized = { ...persisted, theme: "dark" as const };
      setLastSavedSettings(normalized);
      setSettings(normalized);
      setSaveMessage("Settings saved.");
    } catch {
      setSaveMessage("Could not save settings to server.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEmail = async () => {
    const normalizedEmail = emailInput.trim().toLowerCase();

    if (!normalizedEmail || !emailPasswordInput.trim()) {
      setEmailMessage("Enter a new email and your current password.");
      return;
    }

    setIsUpdatingEmail(true);
    setEmailMessage(null);

    try {
      await updateEmail({
        newEmail: normalizedEmail,
        currentPassword: emailPasswordInput
      });

      setEmailPasswordInput("");
      setEmailMessage("Email updated.");
    } catch {
      setEmailMessage("Could not update email. Verify your current password and try again.");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPasswordInput || !newPasswordInput) {
      setPasswordMessage("Enter your current password and a new password.");
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordMessage("New password and confirmation do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordMessage(null);

    try {
      await updatePassword({
        currentPassword: currentPasswordInput,
        newPassword: newPasswordInput
      });

      setCurrentPasswordInput("");
      setNewPasswordInput("");
      setConfirmPasswordInput("");
      setPasswordMessage("Password updated.");
    } catch {
      setPasswordMessage("Could not update password. Verify your current password and try again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const sidebar = (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.36em] text-sky-300">Preferences</p>
      <h2 className="mt-3 font-display text-2xl font-semibold text-white">Account settings</h2>
      <p className="mt-2 text-sm text-slate-400">
        Tune your personal experience, notifications, and security defaults.
      </p>
    </div>
  );

  return (
    <>
      <Header variant="dashboard" />
      <DashboardLayout sidebar={sidebar}>
        <section className="space-y-4 rounded-[1.75rem] border border-white/10 bg-slate-900/60 p-5 md:p-7">
          <div>
            <p className="text-xs uppercase tracking-[0.36em] text-cyan-300">Settings</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-white">Your preferences</h1>
            <p className="mt-2 text-sm text-slate-400">
              Your preferences are loaded from and saved to your account in the database.
            </p>
          </div>

          {isLoading ? <p className="text-sm text-slate-400">Loading settings...</p> : null}

          <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Moon className="h-4 w-4 text-sky-300" />
              <h2 className="text-sm font-semibold text-white">Appearance</h2>
            </div>

            <div className="rounded-xl border border-sky-300/30 bg-sky-500/10 px-3 py-3 text-sm text-slate-300">
              Dark mode is temporarily locked on while the rest of settings work is being stabilized.
            </div>
          </div>

          <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-300" />
              <h2 className="text-sm font-semibold text-white">Notifications</h2>
            </div>

            <div className="space-y-2">

              <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                <span className="text-sm text-slate-200">Milestone due date is approaching</span>
                <input
                  type="checkbox"
                  checked={settings.notifyMilestoneDueSoon}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, notifyMilestoneDueSoon: event.target.checked }))
                  }
                  className="h-4 w-4 accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                <span className="text-sm text-slate-200">A milestone was completed</span>
                <input
                  type="checkbox"
                  checked={settings.notifyMilestoneCompleted}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, notifyMilestoneCompleted: event.target.checked }))
                  }
                  className="h-4 w-4 accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                <span className="text-sm text-slate-200">I am added to a project</span>
                <input
                  type="checkbox"
                  checked={settings.notifyAddedToProject}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, notifyAddedToProject: event.target.checked }))
                  }
                  className="h-4 w-4 accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                <span className="text-sm text-slate-200">A card assigned to me changed</span>
                <input
                  type="checkbox"
                  checked={settings.notifyAssignedCardChanged}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, notifyAssignedCardChanged: event.target.checked }))
                  }
                  className="h-4 w-4 accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                <span className="text-sm text-slate-200">A new member joined one of my projects</span>
                <input
                  type="checkbox"
                  checked={settings.notifyProjectMemberJoined}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, notifyProjectMemberJoined: event.target.checked }))
                  }
                  className="h-4 w-4 accent-cyan-400"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-cyan-300" />
              <h2 className="text-sm font-semibold text-white">Card details</h2>
            </div>

            <div className="space-y-3">
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm text-slate-200">Show priority</div>
                      <p className="text-xs text-slate-400">Choose whether the card shows priority at all.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showCardPriority}
                      onChange={(event) =>
                        setSettings((prev) => ({ ...prev, showCardPriority: event.target.checked }))
                      }
                      className="h-4 w-4 accent-cyan-400"
                    />
                  </div>
                  <label className="mt-3 block text-xs uppercase tracking-[0.2em] text-slate-400">
                    Priority naming
                    <select
                      value={settings.priorityDisplayMode}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          priorityDisplayMode: event.target.value as AccountSettings["priorityDisplayMode"]
                        }))
                      }
                      disabled={!settings.showCardPriority}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="generic">Generic: Low, Medium, High, Very High</option>
                      <option value="rarity">Rarity: Common, Uncommon, Rare, Legendary</option>
                    </select>
                  </label>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm text-slate-200">Show difficulty / XP</div>
                      <p className="text-xs text-slate-400">Choose whether the card shows difficulty or XP value.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showCardDifficulty}
                      onChange={(event) =>
                        setSettings((prev) => ({ ...prev, showCardDifficulty: event.target.checked }))
                      }
                      className="h-4 w-4 accent-cyan-400"
                    />
                  </div>
                  <label className="mt-3 block text-xs uppercase tracking-[0.2em] text-slate-400">
                    Difficulty naming
                    <select
                      value={settings.difficultyDisplayMode}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          difficultyDisplayMode: event.target.value as AccountSettings["difficultyDisplayMode"]
                        }))
                      }
                      disabled={!settings.showCardDifficulty}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="generic">Generic: Easy, Medium, Hard, Very Hard</option>
                      <option value="experience">Experience: 20 XP, 50 XP, 100 XP, 200 XP</option>
                    </select>
                  </label>
                </div>
              </div>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                <span className="text-sm text-slate-200">Use compact card layout in board columns</span>
                <input
                  type="checkbox"
                  checked={settings.compactBoardCards}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, compactBoardCards: event.target.checked }))
                  }
                  className="h-4 w-4 accent-cyan-400"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-4">
            <div className="mb-1 flex items-center gap-2 text-rose-100">
              <Lock className="h-4 w-4" />
              <p className="text-sm font-semibold">Account security</p>
            </div>

            <div className="mt-3 space-y-3">
              <div className="rounded-xl border border-rose-200/20 bg-slate-950/35 p-3">
                <div className="mb-2 flex items-center gap-2 text-rose-100">
                  <Mail className="h-4 w-4" />
                  <p className="text-sm font-semibold">Change email</p>
                </div>
                <p className="mb-3 text-xs text-rose-100/80">Current email: {user?.email ?? "Unknown"}</p>

                <div className="grid gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(event) => setEmailInput(event.target.value)}
                    placeholder="new-email@example.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                  />
                  <input
                    type="password"
                    value={emailPasswordInput}
                    onChange={(event) => setEmailPasswordInput(event.target.value)}
                    placeholder="Current password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-rose-100/80">{emailMessage ?? " "}</p>
                    <Button
                      variant="outline"
                      onClick={() => void handleUpdateEmail()}
                      disabled={isUpdatingEmail || !emailInput.trim() || !emailPasswordInput.trim()}
                    >
                      {isUpdatingEmail ? "Updating..." : "Update Email"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-rose-200/20 bg-slate-950/35 p-3">
                <div className="mb-2 flex items-center gap-2 text-rose-100">
                  <KeyRound className="h-4 w-4" />
                  <p className="text-sm font-semibold">Reset password</p>
                </div>

                <div className="grid gap-2">
                  <input
                    type="password"
                    value={currentPasswordInput}
                    onChange={(event) => setCurrentPasswordInput(event.target.value)}
                    placeholder="Current password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                  />
                  <input
                    type="password"
                    value={newPasswordInput}
                    onChange={(event) => setNewPasswordInput(event.target.value)}
                    placeholder="New password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                  />
                  <input
                    type="password"
                    value={confirmPasswordInput}
                    onChange={(event) => setConfirmPasswordInput(event.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-rose-100/80">{passwordMessage ?? " "}</p>
                    <Button
                      variant="outline"
                      onClick={() => void handleUpdatePassword()}
                      disabled={
                        isUpdatingPassword ||
                        !currentPasswordInput ||
                        !newPasswordInput ||
                        !confirmPasswordInput
                      }
                    >
                      {isUpdatingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">{saveMessage ?? " "}</p>
            <Button onClick={() => void handleSave()} disabled={!isDirty || isSaving || isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save settings"}
            </Button>
          </div>
        </section>
      </DashboardLayout>
    </>
  );
};
