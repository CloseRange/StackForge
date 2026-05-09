import type {
  CreateMilestoneInput,
  CreateProjectInput,
  Project,
  ProjectActivityResponse,
  ProjectMilestone,
  ProjectMember,
  ProjectMembersResponse,
  ProjectRole,
  UpdateMilestoneInput,
  UpdateProjectInput
} from "../types/api";
import { request } from "./api";

type UpdateMemberPermissionsInput = {
  roleId: string;
  deckReadMode: "FULL_ACCESS" | "NO_ACCESS" | "WHITELIST" | "BLACKLIST";
  deckReadDeckIds: string[];
  deckWriteMode: "FULL_ACCESS" | "NO_ACCESS" | "WHITELIST" | "BLACKLIST";
  deckWriteDeckIds: string[];
};

type ProjectStats = {
  totalXp: number;
  earnedXp: number;
  cardCount: number;
};

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

  update(token: string, projectId: string, payload: UpdateProjectInput) {
    return request<Project>(`/projects/${projectId}`, {
      method: "PATCH",
      token,
      body: payload
    });
  },

  getStats(token: string, projectId: string) {
    return request<ProjectStats>(`/projects/${projectId}/stats`, { token });
  },

  getActivity(
    token: string,
    projectId: string,
    options?: { limit?: number; entityType?: "project" | "deck" | "card" | "member" }
  ) {
    const params = new URLSearchParams();

    if (options?.limit) {
      params.set("limit", String(options.limit));
    }

    if (options?.entityType) {
      params.set("entityType", options.entityType);
    }

    const suffix = params.size > 0 ? `?${params.toString()}` : "";
    return request<ProjectActivityResponse>(`/projects/${projectId}/activity${suffix}`, { token });
  },

  listMilestones(token: string, projectId: string) {
    return request<ProjectMilestone[]>(`/projects/${projectId}/milestones`, { token });
  },

  createMilestone(token: string, projectId: string, payload: CreateMilestoneInput) {
    return request<ProjectMilestone>(`/projects/${projectId}/milestones`, {
      method: "POST",
      token,
      body: payload
    });
  },

  updateMilestone(
    token: string,
    projectId: string,
    milestoneId: string,
    payload: UpdateMilestoneInput
  ) {
    return request<ProjectMilestone>(`/projects/${projectId}/milestones/${milestoneId}`, {
      method: "PATCH",
      token,
      body: payload
    });
  },

  removeMilestone(token: string, projectId: string, milestoneId: string) {
    return request<void>(`/projects/${projectId}/milestones/${milestoneId}`, {
      method: "DELETE",
      token
    });
  },

  listMembers(token: string, projectId: string) {
    return request<ProjectMembersResponse>(`/projects/${projectId}/members`, { token });
  },

  listRoles(token: string, projectId: string) {
    return request<ProjectRole[]>(`/projects/${projectId}/roles`, { token });
  },

  createRole(token: string, projectId: string, name: string) {
    return request<ProjectRole>(`/projects/${projectId}/roles`, {
      method: "POST",
      token,
      body: { name }
    });
  },

  removeRole(token: string, projectId: string, roleId: string) {
    return request<void>(`/projects/${projectId}/roles/${roleId}`, {
      method: "DELETE",
      token
    });
  },

  addMember(token: string, projectId: string, userCode: string) {
    return request<ProjectMember>(`/projects/${projectId}/members`, {
      method: "POST",
      token,
      body: { userCode }
    });
  },

  updateMemberPermissions(
    token: string,
    projectId: string,
    userId: string,
    payload: UpdateMemberPermissionsInput
  ) {
    return request<ProjectMember>(`/projects/${projectId}/members/${userId}`, {
      method: "PATCH",
      token,
      body: payload
    });
  },

  removeMember(token: string, projectId: string, userId: string) {
    return request<void>(`/projects/${projectId}/members/${userId}`, {
      method: "DELETE",
      token
    });
  }
};
