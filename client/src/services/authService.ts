import type { AccountSettings, AuthPayload, UpdateAccountSettingsInput, User } from "../types/api";
import { AUTH_EXPIRED_EVENT, ApiError } from "./api";
import { request } from "./api";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

export const authService = {
  register(payload: { email: string; password: string; displayName: string }) {
    return request<AuthPayload>("/auth/register", {
      method: "POST",
      body: payload
    });
  },

  login(payload: { email: string; password: string }) {
    return request<AuthPayload>("/auth/login", {
      method: "POST",
      body: payload
    });
  },

  getProfile(token: string) {
    return request<User>("/auth/profile", {
      method: "GET",
      token
    });
  },

  getSettings(token: string) {
    return request<AccountSettings>("/auth/settings", {
      method: "GET",
      token
    });
  },

  updateSettings(token: string, payload: UpdateAccountSettingsInput) {
    return request<AccountSettings>("/auth/settings", {
      method: "PUT",
      token,
      body: payload
    });
  },

  updateProfile(
    token: string,
    payload: { firstName?: string; lastName?: string; statusMessage?: string; avatarUrl?: string }
  ) {
    return request<User>("/auth/profile", {
      method: "PUT",
      token,
      body: payload
    });
  },

  async uploadAvatar(token: string, file: File) {
    const response = await fetch(`${API_BASE_URL}/auth/profile/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": file.type
      },
      body: file
    });

    const payload = (await response.json()) as { data?: User; message?: string };

    if (!response.ok) {
      const message = payload.message ?? "Avatar upload failed";

      if (response.status === 401) {
        localStorage.removeItem("stackforge-auth");
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      }

      throw new ApiError(message, response.status);
    }

    return payload.data as User;
  }
};
