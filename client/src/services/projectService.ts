import type { CreateProjectInput, Project, ProjectMember, ProjectMembersResponse } from "../types/api";
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
  },

  listMembers(token: string, projectId: string) {
    return request<ProjectMembersResponse>(`/projects/${projectId}/members`, { token });
  },

  addMember(token: string, projectId: string, userCode: string) {
    return request<ProjectMember>(`/projects/${projectId}/members`, {
      method: "POST",
      token,
      body: { userCode }
    });
  },

  removeMember(token: string, projectId: string, userId: string) {
    return request<void>(`/projects/${projectId}/members/${userId}`, {
      method: "DELETE",
      token
    });
  }
};
