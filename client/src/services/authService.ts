import type { AuthPayload } from "../types/api";
import { request } from "./api";

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
  }
};
