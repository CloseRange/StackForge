import { useEffect, useMemo, useState } from "react";
import { Bell, Lock, Monitor, Moon, Save, Shield, Sparkles, Sun } from "lucide-react";

import { Header } from "../components/header/Header";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { DashboardLayout } from "../layouts/DashboardLayout";

import type { AccountSettings } from "../types/api";

const DEFAULT_SETTINGS: AccountSettings = {
  theme: "system",
  emailMentions: true,
  weeklyDigest: false,
  desktopAlerts: true,
  compactBoardCards: false,
  cardGlowIntensity: 100
};

export const SettingsPage = () => {
  const { getSettings, updateSettings } = useAuth();
  const [settings, setSettings] = useState<AccountSettings>(DEFAULT_SETTINGS);
  const [lastSavedSettings, setLastSavedSettings] = useState<AccountSettings>(DEFAULT_SETTINGS);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      setIsLoading(true);

      try {
        const persisted = await getSettings();

        if (!isMounted) {
          return;
        }

        setSettings(persisted);
        setLastSavedSettings(persisted);
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
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applyThemePreview = () => {
      const resolved = settings.theme === "system" ? (media.matches ? "dark" : "light") : settings.theme;
      root.dataset.theme = resolved;
      root.style.colorScheme = resolved;
    };

    applyThemePreview();

    const onSystemChange = () => {
      if (settings.theme === "system") {
        applyThemePreview();
      }
    };

    media.addEventListener("change", onSystemChange);
    return () => {
      media.removeEventListener("change", onSystemChange);
    };
  }, [settings.theme]);

  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(lastSavedSettings);
  }, [lastSavedSettings, settings]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const persisted = await updateSettings(settings);
      setLastSavedSettings(persisted);
      setSettings(persisted);
      setSaveMessage("Settings saved.");
    } catch {
      setSaveMessage("Could not save settings to server.");
    } finally {
      setIsSaving(false);
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
              <Monitor className="h-4 w-4 text-sky-300" />
              <h2 className="text-sm font-semibold text-white">Appearance</h2>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, theme: "system" }))}
                className={`rounded-xl border px-3 py-2 text-sm transition ${
                  settings.theme === "system"
                    ? "border-cyan-300/40 bg-cyan-500/10 text-cyan-100"
                    : "border-white/12 bg-white/[0.02] text-slate-300 hover:text-white"
                }`}
              >
                <Monitor className="mx-auto mb-1 h-4 w-4" />
                System
              </button>
              <button
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, theme: "light" }))}
                className={`rounded-xl border px-3 py-2 text-sm transition ${
                  settings.theme === "light"
                    ? "border-cyan-300/40 bg-cyan-500/10 text-cyan-100"
                    : "border-white/12 bg-white/[0.02] text-slate-300 hover:text-white"
                }`}
              >
                <Sun className="mx-auto mb-1 h-4 w-4" />
                Light
              </button>
              <button
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, theme: "dark" }))}
                className={`rounded-xl border px-3 py-2 text-sm transition ${
                  settings.theme === "dark"
                    ? "border-cyan-300/40 bg-cyan-500/10 text-cyan-100"
                    : "border-white/12 bg-white/[0.02] text-slate-300 hover:text-white"
                }`}
              >
                <Moon className="mx-auto mb-1 h-4 w-4" />
                Dark
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-300" />
              <h2 className="text-sm font-semibold text-white">Notifications</h2>
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                <span className="text-sm text-slate-200">Email me when someone mentions me</span>
                <input
                  type="checkbox"
                  checked={settings.emailMentions}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, emailMentions: event.target.checked }))
                  }
                  className="h-4 w-4 accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                <span className="text-sm text-slate-200">Send a weekly activity digest</span>
                <input
                  type="checkbox"
                  checked={settings.weeklyDigest}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, weeklyDigest: event.target.checked }))
                  }
                  className="h-4 w-4 accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                <span className="text-sm text-slate-200">Enable desktop alerts</span>
                <input
                  type="checkbox"
                  checked={settings.desktopAlerts}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, desktopAlerts: event.target.checked }))
                  }
                  className="h-4 w-4 accent-cyan-400"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-300" />
              <h2 className="text-sm font-semibold text-white">Board behavior</h2>
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

            <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  <span className="text-sm text-slate-200">Card glow intensity</span>
                </div>
                <span className="rounded-md border border-cyan-300/35 bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-100">
                  {settings.cardGlowIntensity}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={settings.cardGlowIntensity}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    cardGlowIntensity: Math.min(100, Math.max(0, Number(event.target.value) || 0))
                  }))
                }
                className="mt-3 w-full accent-cyan-400"
              />
              <p className="mt-1 text-xs text-slate-400">
                Controls board card shadow/glow strength from subtle to full.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-4">
            <div className="mb-1 flex items-center gap-2 text-rose-100">
              <Lock className="h-4 w-4" />
              <p className="text-sm font-semibold">Security shortcuts</p>
            </div>
            <p className="text-sm text-rose-100/80">
              Need to change your name, avatar, or status message? Use the Profile page from the same menu.
            </p>
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
