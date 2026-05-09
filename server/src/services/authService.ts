import { supabaseAdmin, supabaseAnon } from "../config/db.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import { loginSchema, registerSchema, updateAccountSettingsSchema, updateProfileSchema } from "../utils/validators.js";

type AuthMetadata = {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  statusMessage?: string;
  userCode?: string;
  avatarUrl?: string;
  avatarPath?: string;
};

type UploadAvatarInput = {
  file: Buffer;
  contentType: string;
};

type ThemePreference = "system" | "light" | "dark";

type AccountSettings = {
  theme: ThemePreference;
  emailMentions: boolean;
  weeklyDigest: boolean;
  desktopAlerts: boolean;
  compactBoardCards: boolean;
  cardGlowIntensity: number;
};

type UserSettingsRow = {
  user_id: string;
  theme_preference: ThemePreference;
  email_mentions: boolean;
  weekly_digest: boolean;
  desktop_alerts: boolean;
  compact_board_cards: boolean;
  card_glow_intensity?: number;
};

const isMissingCardGlowIntensityColumnError = (message: string | null | undefined) =>
  (message ?? "").includes("sf_user_settings.card_glow_intensity");

const defaultAccountSettings = (): AccountSettings => ({
  theme: "system",
  emailMentions: true,
  weeklyDigest: false,
  desktopAlerts: true,
  compactBoardCards: false,
  cardGlowIntensity: 100
});

const mapUserSettingsRow = (row: UserSettingsRow): AccountSettings => {
  return {
    theme: row.theme_preference,
    emailMentions: row.email_mentions,
    weeklyDigest: row.weekly_digest,
    desktopAlerts: row.desktop_alerts,
    compactBoardCards: row.compact_board_cards,
    cardGlowIntensity: row.card_glow_intensity ?? 100
  };
};

const USER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const normalizeMetadata = (metadata: unknown): AuthMetadata => {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }

  return metadata as AuthMetadata;
};

const randomUserCode = () => {
  let code = "";

  for (let i = 0; i < 4; i += 1) {
    const index = Math.floor(Math.random() * USER_CODE_ALPHABET.length);
    code += USER_CODE_ALPHABET[index];
  }

  return code;
};

const isValidUserCode = (value: string | undefined) => {
  return Boolean(value && /^[A-Z0-9]{4}$/.test(value));
};

const listExistingUserCodes = async (excludeUserId: string) => {
  const codes = new Set<string>();

  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new AppError(error.message, 500);
    }

    const users = data.users ?? [];

    users.forEach((user) => {
      if (user.id === excludeUserId) {
        return;
      }

      const metadata = normalizeMetadata(user.user_metadata);
      const normalized = metadata.userCode?.toUpperCase();

      if (isValidUserCode(normalized)) {
        codes.add(normalized as string);
      }
    });

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  return codes;
};

const ensureUserCode = async (userId: string, metadata: AuthMetadata) => {
  const existingCode = metadata.userCode?.toUpperCase();

  if (isValidUserCode(existingCode)) {
    return existingCode as string;
  }

  const existingCodes = await listExistingUserCodes(userId);

  for (let attempt = 0; attempt < 64; attempt += 1) {
    const code = randomUserCode();

    if (!existingCodes.has(code)) {
      return code;
    }
  }

  throw new AppError("Failed to generate unique user code", 500);
};

const composeDisplayName = (firstName: string, lastName: string, fallback: string) => {
  const combined = `${firstName} ${lastName}`.trim();
  return combined || fallback;
};

const defaultDisplayName = (email: string | null | undefined) => {
  if (!email) {
    return "Operator";
  }

  const local = email.split("@")[0]?.trim();
  return local || "Operator";
};

const toAuthPayloadUser = (user: { id: string; email?: string | null }, metadata: AuthMetadata) => {
  const displayName = metadata.displayName || defaultDisplayName(user.email);

  return {
    id: user.id,
    email: user.email,
    displayName,
    firstName: metadata.firstName ?? "",
    lastName: metadata.lastName ?? "",
    statusMessage: metadata.statusMessage ?? "",
    userCode: metadata.userCode ?? "",
    avatarUrl: metadata.avatarUrl ?? null
  };
};

const avatarExtensionByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

const getAvatarFileExtension = (contentType: string) => {
  const normalized = contentType.toLowerCase().split(";")[0]?.trim();
  const extension = avatarExtensionByMime[normalized ?? ""];

  if (!extension) {
    throw new AppError("Unsupported image type. Use jpg, png, webp, or gif", 400);
  }

  return { extension, normalized: normalized as keyof typeof avatarExtensionByMime };
};

const tryRemoveStoredAvatar = async (avatarPath: string | undefined, avatarUrl: string | undefined) => {
  const directPath = avatarPath?.trim();

  if (directPath) {
    await supabaseAdmin.storage.from(env.SUPABASE_AVATAR_BUCKET).remove([directPath]);
    return;
  }

  if (!avatarUrl) {
    return;
  }

  const marker = `/storage/v1/object/public/${env.SUPABASE_AVATAR_BUCKET}/`;
  const markerIndex = avatarUrl.indexOf(marker);

  if (markerIndex === -1) {
    return;
  }

  const path = decodeURIComponent(avatarUrl.slice(markerIndex + marker.length));

  if (!path) {
    return;
  }

  // Best-effort cleanup for previous avatar files.
  await supabaseAdmin.storage.from(env.SUPABASE_AVATAR_BUCKET).remove([path]);
};

const getAvatarPathFromUrl = (avatarUrl: string | undefined) => {
  if (!avatarUrl) {
    return undefined;
  }

  const publicMarker = `/storage/v1/object/public/${env.SUPABASE_AVATAR_BUCKET}/`;
  const signedMarker = `/storage/v1/object/sign/${env.SUPABASE_AVATAR_BUCKET}/`;

  if (avatarUrl.includes(publicMarker)) {
    const raw = avatarUrl.split(publicMarker)[1]?.split("?")[0];
    return raw ? decodeURIComponent(raw) : undefined;
  }

  if (avatarUrl.includes(signedMarker)) {
    const raw = avatarUrl.split(signedMarker)[1]?.split("?")[0];
    return raw ? decodeURIComponent(raw) : undefined;
  }

  return undefined;
};

const getSignedAvatarUrl = async (path: string) => {
  const { data, error } = await supabaseAdmin.storage
    .from(env.SUPABASE_AVATAR_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 30);

  if (error || !data.signedUrl) {
    throw new AppError(error?.message ?? "Failed to sign avatar URL", 500);
  }

  return data.signedUrl;
};

const enrichAvatarMetadata = async (metadata: AuthMetadata) => {
  const avatarPath = metadata.avatarPath ?? getAvatarPathFromUrl(metadata.avatarUrl);

  if (!avatarPath) {
    return metadata;
  }

  try {
    const signedUrl = await getSignedAvatarUrl(avatarPath);
    return {
      ...metadata,
      avatarPath,
      avatarUrl: signedUrl
    };
  } catch {
    return metadata;
  }
};

const getUserByIdOrThrow = async (userId: string) => {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error || !data.user) {
    throw new AppError(error?.message ?? "User not found", 404);
  }

  return data.user;
};

const syncUserCodeIfMissing = async (userId: string, metadata: AuthMetadata) => {
  const ensuredCode = await ensureUserCode(userId, metadata);
  const normalizedCode = metadata.userCode?.toUpperCase();

  if (normalizedCode === ensuredCode) {
    return { metadata: { ...metadata, userCode: ensuredCode }, updated: false };
  }

  const mergedMetadata = {
    ...metadata,
    userCode: ensuredCode
  };

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: mergedMetadata
  });

  if (error) {
    throw new AppError(error.message, 500);
  }

  return { metadata: mergedMetadata, updated: true };
};

export const authService = {
  async register(payload: unknown) {
    const data = registerSchema.parse(payload);

    // Use admin API so the account is confirmed immediately (no email link required).
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      user_metadata: { displayName: data.displayName },
      email_confirm: true
    });

    if (createError) {
      const message = createError.message.includes("already")
        ? "Email is already registered"
        : createError.message;
      throw new AppError(message, 409);
    }

    // Sign in to get a session token the client can use immediately.
    const { data: session, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (signInError || !session.session) {
      throw new AppError("Account created but sign-in failed", 500);
    }

    const rawMetadata = normalizeMetadata(created.user.user_metadata);
    const { metadata } = await syncUserCodeIfMissing(created.user.id, {
      ...rawMetadata,
      displayName: rawMetadata.displayName || data.displayName
    });

    return {
      token: session.session.access_token,
      user: toAuthPayloadUser(created.user, metadata)
    };
  },

  async login(payload: unknown) {
    const data = loginSchema.parse(payload);

    const { data: session, error } = await supabaseAnon.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (error || !session.session) {
      throw new AppError("Invalid email or password", 401);
    }

    const rawMetadata = normalizeMetadata(session.user.user_metadata);
    const { metadata } = await syncUserCodeIfMissing(session.user.id, rawMetadata);
    const avatarMetadata = await enrichAvatarMetadata(metadata);

    return {
      token: session.session.access_token,
      user: toAuthPayloadUser(session.user, avatarMetadata)
    };
  },

  async getProfile(userId: string) {
    const user = await getUserByIdOrThrow(userId);
    const rawMetadata = normalizeMetadata(user.user_metadata);
    const { metadata } = await syncUserCodeIfMissing(user.id, rawMetadata);
    const avatarMetadata = await enrichAvatarMetadata(metadata);

    return toAuthPayloadUser(user, avatarMetadata);
  },

  async updateProfile(userId: string, payload: unknown) {
    const input = updateProfileSchema.parse(payload);
    const user = await getUserByIdOrThrow(userId);
    const metadata = normalizeMetadata(user.user_metadata);

    const firstName = (input.firstName ?? metadata.firstName ?? "").trim();
    const lastName = (input.lastName ?? metadata.lastName ?? "").trim();
    const statusMessage = (input.statusMessage ?? metadata.statusMessage ?? "").trim();
    const avatarUrlInput = input.avatarUrl;
    const avatarUrl =
      avatarUrlInput === undefined
        ? metadata.avatarUrl
        : avatarUrlInput
          ? avatarUrlInput.trim()
          : undefined;
    const avatarPath = metadata.avatarPath ?? getAvatarPathFromUrl(metadata.avatarUrl);
    const fallbackDisplayName = metadata.displayName || defaultDisplayName(user.email);
    const displayName = composeDisplayName(firstName, lastName, fallbackDisplayName);
    const userCode = await ensureUserCode(userId, metadata);

    const mergedMetadata: AuthMetadata = {
      ...metadata,
      firstName,
      lastName,
      statusMessage,
      displayName,
      userCode,
      avatarUrl,
      avatarPath
    };

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: mergedMetadata
    });

    if (error || !data.user) {
      throw new AppError(error?.message ?? "Failed to update profile", 500);
    };

    const avatarMetadata = await enrichAvatarMetadata(mergedMetadata);
    return toAuthPayloadUser(data.user, avatarMetadata);
  },

  async uploadAvatar(userId: string, input: UploadAvatarInput) {
    const user = await getUserByIdOrThrow(userId);
    const metadata = normalizeMetadata(user.user_metadata);
    const { extension, normalized } = getAvatarFileExtension(input.contentType);
    const filePath = `${userId}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(env.SUPABASE_AVATAR_BUCKET)
      .upload(filePath, input.file, {
        contentType: normalized,
        upsert: false,
        cacheControl: "3600"
      });

    if (uploadError) {
      throw new AppError(uploadError.message, 500);
    }

    await tryRemoveStoredAvatar(metadata.avatarPath, metadata.avatarUrl);

    const signedUrl = await getSignedAvatarUrl(filePath);

    const mergedMetadata: AuthMetadata = {
      ...metadata,
      avatarUrl: signedUrl,
      avatarPath: filePath
    };

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: mergedMetadata
    });

    if (error || !data.user) {
      throw new AppError(error?.message ?? "Failed to update avatar", 500);
    }

    return toAuthPayloadUser(data.user, mergedMetadata);
  },

  async getSettings(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("sf_user_settings")
      .select("user_id, theme_preference, email_mentions, weekly_digest, desktop_alerts, compact_board_cards, card_glow_intensity")
      .eq("user_id", userId)
      .maybeSingle<UserSettingsRow>();

    if (error && !isMissingCardGlowIntensityColumnError(error.message)) {
      throw new AppError(error.message, 500);
    }

    let resolvedData = data;

    if (error && isMissingCardGlowIntensityColumnError(error.message)) {
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from("sf_user_settings")
        .select("user_id, theme_preference, email_mentions, weekly_digest, desktop_alerts, compact_board_cards")
        .eq("user_id", userId)
        .maybeSingle<UserSettingsRow>();

      if (fallbackError) {
        throw new AppError(fallbackError.message, 500);
      }

      resolvedData = fallbackData;
    }

    if (resolvedData) {
      return mapUserSettingsRow(resolvedData);
    }

    const defaults = defaultAccountSettings();
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("sf_user_settings")
      .insert({
        user_id: userId,
        theme_preference: defaults.theme,
        email_mentions: defaults.emailMentions,
        weekly_digest: defaults.weeklyDigest,
        desktop_alerts: defaults.desktopAlerts,
        compact_board_cards: defaults.compactBoardCards,
        card_glow_intensity: defaults.cardGlowIntensity
      })
      .select("user_id, theme_preference, email_mentions, weekly_digest, desktop_alerts, compact_board_cards, card_glow_intensity")
      .single<UserSettingsRow>();

    if (insertError && isMissingCardGlowIntensityColumnError(insertError.message)) {
      const { data: fallbackInserted, error: fallbackInsertError } = await supabaseAdmin
        .from("sf_user_settings")
        .insert({
          user_id: userId,
          theme_preference: defaults.theme,
          email_mentions: defaults.emailMentions,
          weekly_digest: defaults.weeklyDigest,
          desktop_alerts: defaults.desktopAlerts,
          compact_board_cards: defaults.compactBoardCards
        })
        .select("user_id, theme_preference, email_mentions, weekly_digest, desktop_alerts, compact_board_cards")
        .single<UserSettingsRow>();

      if (fallbackInsertError || !fallbackInserted) {
        throw new AppError(fallbackInsertError?.message ?? "Failed to initialize user settings", 500);
      }

      return mapUserSettingsRow(fallbackInserted);
    }

    if (insertError || !inserted) {
      throw new AppError(insertError?.message ?? "Failed to initialize user settings", 500);
    }

    return mapUserSettingsRow(inserted);
  },

  async updateSettings(userId: string, payload: unknown) {
    const input = updateAccountSettingsSchema.parse(payload);
    const upsertPayload: {
      user_id: string;
      theme_preference?: ThemePreference;
      email_mentions?: boolean;
      weekly_digest?: boolean;
      desktop_alerts?: boolean;
      compact_board_cards?: boolean;
      card_glow_intensity?: number;
    } = {
      user_id: userId
    };

    if (input.theme !== undefined) {
      upsertPayload.theme_preference = input.theme;
    }

    if (input.emailMentions !== undefined) {
      upsertPayload.email_mentions = input.emailMentions;
    }

    if (input.weeklyDigest !== undefined) {
      upsertPayload.weekly_digest = input.weeklyDigest;
    }

    if (input.desktopAlerts !== undefined) {
      upsertPayload.desktop_alerts = input.desktopAlerts;
    }

    if (input.compactBoardCards !== undefined) {
      upsertPayload.compact_board_cards = input.compactBoardCards;
    }

    if (input.cardGlowIntensity !== undefined) {
      upsertPayload.card_glow_intensity = input.cardGlowIntensity;
    }

    const { data, error } = await supabaseAdmin
      .from("sf_user_settings")
      .upsert(upsertPayload, { onConflict: "user_id" })
      .select("user_id, theme_preference, email_mentions, weekly_digest, desktop_alerts, compact_board_cards, card_glow_intensity")
      .single<UserSettingsRow>();

    if (error && isMissingCardGlowIntensityColumnError(error.message)) {
      const fallbackPayload = {
        user_id: userId,
        theme_preference: upsertPayload.theme_preference,
        email_mentions: upsertPayload.email_mentions,
        weekly_digest: upsertPayload.weekly_digest,
        desktop_alerts: upsertPayload.desktop_alerts,
        compact_board_cards: upsertPayload.compact_board_cards
      };

      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from("sf_user_settings")
        .upsert(fallbackPayload, { onConflict: "user_id" })
        .select("user_id, theme_preference, email_mentions, weekly_digest, desktop_alerts, compact_board_cards")
        .single<UserSettingsRow>();

      if (fallbackError || !fallbackData) {
        throw new AppError(fallbackError?.message ?? "Failed to update settings", 500);
      }

      return mapUserSettingsRow(fallbackData);
    }

    if (error || !data) {
      throw new AppError(error?.message ?? "Failed to update settings", 500);
    }

    return mapUserSettingsRow(data);
  }
};
