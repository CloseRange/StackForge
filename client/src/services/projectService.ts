import type { CreateProjectInput, Project } from "../types/api";
import { request } from "./api";

export const projectService = {
  list(token: string) {
    return request<Project[]>("/projects", { token });
  },

  create(token: string, payload: CreateProjectInput) {
    return request<Project>("/projects", {
      method: "POST",
      token,
      body: payload
    });
  }
};
