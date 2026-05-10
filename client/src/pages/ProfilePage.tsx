import { useEffect, useMemo, useState } from "react";
import { Copy, Save, Upload, UserRound } from "lucide-react";

import { Header } from "../components/header/Header";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { DashboardLayout } from "../layouts/DashboardLayout";

export const ProfilePage = () => {
  const { token, user, accountSettings, getSettings, refreshProfile, updateProfile, updateSettings, uploadAvatar } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [aliasName, setAliasName] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    void refreshProfile();
    void getSettings();
  }, [getSettings, refreshProfile, token]);

  useEffect(() => {
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setStatusMessage(user?.statusMessage ?? "");
  }, [user?.firstName, user?.lastName, user?.statusMessage]);

  useEffect(() => {
    setAliasName(accountSettings?.aliasName ?? "");
  }, [accountSettings?.aliasName]);

  const code = user?.userCode || "----";

  const isDirty = useMemo(() => {
    return (
      firstName.trim() !== (user?.firstName ?? "") ||
      lastName.trim() !== (user?.lastName ?? "") ||
      aliasName.trim() !== (accountSettings?.aliasName ?? "") ||
      statusMessage.trim() !== (user?.statusMessage ?? "")
    );
  }, [
    accountSettings?.aliasName,
    aliasName,
    firstName,
    lastName,
    statusMessage,
    user?.firstName,
    user?.lastName,
    user?.statusMessage
  ]);

  const handleSave = async () => {
    if (!isDirty) {
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const normalizedAlias = aliasName.trim();
      const profileChanged =
        firstName.trim() !== (user?.firstName ?? "") ||
        lastName.trim() !== (user?.lastName ?? "") ||
        statusMessage.trim() !== (user?.statusMessage ?? "");
      const aliasChanged = normalizedAlias !== (accountSettings?.aliasName ?? "");

      if (profileChanged) {
        await updateProfile({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          statusMessage: statusMessage.trim()
        });
      }

      if (aliasChanged) {
        await updateSettings({ aliasName: normalizedAlias });
      }

      setSaveMessage("Profile saved.");
    } catch {
      setSaveMessage("Could not save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSaveMessage("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage("Avatar must be 5MB or smaller.");
      return;
    }

    setIsUploadingAvatar(true);
    setSaveMessage(null);

    try {
      await uploadAvatar(file);
      setSaveMessage("Profile picture updated.");
    } catch {
      setSaveMessage("Could not upload profile picture. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <>
      <Header variant="dashboard" />
      <DashboardLayout>
        <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/60 p-5 md:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.36em] text-cyan-300">Profile</p>
              <h1 className="mt-2 font-display text-3xl font-semibold text-white">Your account details</h1>
              <p className="mt-2 text-sm text-slate-400">Update your name, set your status, and share your user code.</p>
            </div>
            <div className="hidden rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-3 text-cyan-100 md:block">
              <UserRound className="h-5 w-5" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-white">Profile picture</span>
              <div className="flex flex-col gap-3 rounded-xl border border-white/12 bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Profile avatar"
                      className="h-16 w-16 rounded-xl border border-white/20 object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/15 bg-slate-800/50">
                      <UserRound className="h-7 w-7 text-slate-300" />
                    </div>
                  )}
                  <p className="text-sm text-slate-400">PNG, JPG, WEBP, or GIF up to 5MB.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      void handleAvatarUpload(file);
                      event.currentTarget.value = "";
                    }}
                  />
                  <span className="inline-flex items-center rounded-xl border border-white/20 bg-white/8 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/12">
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploadingAvatar ? "Uploading..." : "Upload photo"}
                  </span>
                </label>
              </div>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-white">First name</span>
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Ada"
                className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-sm text-white outline-none"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-white">Last name</span>
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Lovelace"
                className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-sm text-white outline-none"
              />
            </label>
            <label className="md:col-span-2 space-y-2">
              <span className="text-sm font-semibold text-white">Alias</span>
              <input
                value={aliasName}
                onChange={(event) => setAliasName(event.target.value)}
                placeholder={user?.displayName ?? "Choose an alias"}
                maxLength={40}
                className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-sm text-white outline-none"
              />
              <span className="text-xs text-slate-500">
                When set, your alias is shown around the app instead of your normal display name.
              </span>
            </label>
          </div>

          <label className="mt-4 block space-y-2">
            <span className="text-sm font-semibold text-white">Status message</span>
            <input
              value={statusMessage}
              onChange={(event) => setStatusMessage(event.target.value)}
              maxLength={140}
              placeholder="Shipping cards and leveling campaigns."
              className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-sm text-white outline-none"
            />
            <span className="text-xs text-slate-500">{statusMessage.trim().length} / 140</span>
          </label>

          <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-200">User code</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-3xl font-bold tracking-[0.3em] text-white">{code}</p>
              <Button
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(code);
                  setSaveMessage("User code copied.");
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Code
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">{saveMessage ?? " "}</p>
            <Button onClick={() => void handleSave()} disabled={isSaving || !isDirty}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </section>
      </DashboardLayout>
    </>
  );
};
