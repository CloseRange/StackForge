import { request } from "./api";
import type {
  AdminMessageSubmission,
  CreateAdminMessageInput,
  DocumentationPayload
} from "../types/api";

export const publicContentService = {
  getReadme() {
    return request<DocumentationPayload>("/public/documentation/readme");
  },

  createAdminMessage(payload: CreateAdminMessageInput, token?: string | null) {
    return request<AdminMessageSubmission>("/public/admin-messages", {
      method: "POST",
      token,
      body: payload
    });
  }
};