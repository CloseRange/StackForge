import { supabaseAdmin } from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";

type DisplayMetadata = {
  displayName?: string;
  firstName?: string;
  lastName?: string;
};

type AliasRow = {
  user_id: string;
  alias_name?: string | null;
};

const isMissingAliasColumnError = (message: string | null | undefined) =>
  (message ?? "").includes("sf_user_settings.alias_name");

export const normalizeAliasName = (aliasName: string | null | undefined) => {
  const trimmed = aliasName?.trim();
  return trimmed ? trimmed : null;
};

export const resolveUserDisplayName = (
  email: string | null | undefined,
  metadata: DisplayMetadata,
  aliasName?: string | null
) => {
  const alias = normalizeAliasName(aliasName);

  if (alias) {
    return alias;
  }

  const explicitName = metadata.displayName?.trim();

  if (explicitName) {
    return explicitName;
  }

  const fullName = `${metadata.firstName ?? ""} ${metadata.lastName ?? ""}`.trim();

  if (fullName) {
    return fullName;
  }

  return email?.split("@")[0]?.trim() || "Operator";
};

export const listUserAliases = async (userIds: string[]) => {
  if (userIds.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabaseAdmin
    .from("sf_user_settings")
    .select("user_id, alias_name")
    .in("user_id", userIds);

  if (error && !isMissingAliasColumnError(error.message)) {
    throw new AppError(error.message, 500);
  }

  if (error && isMissingAliasColumnError(error.message)) {
    return new Map<string, string>();
  }

  const aliases = new Map<string, string>();

  for (const row of (data ?? []) as AliasRow[]) {
    const alias = normalizeAliasName(row.alias_name);

    if (alias) {
      aliases.set(row.user_id, alias);
    }
  }

  return aliases;
};

export const getUserAlias = async (userId: string) => {
  const aliases = await listUserAliases([userId]);
  return aliases.get(userId) ?? null;
};
