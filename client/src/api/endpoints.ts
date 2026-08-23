import { api, getApiErrorMessage } from "./client";

export { getApiErrorMessage };
import type {
  UserPublic,
  Lineup,
  LineupListResponse,
  GameDataBundle,
  CommentNode,
  Suggestion,
  ReportItem,
  Pagination,
} from "../types";

export interface LineupQueryParams {
  q?: string;
  season?: string;
  gameMode?: string;
  commander?: string;
  synergy?: string;
  hero?: string;
  tag?: string;
  difficulty?: string;
  minRating?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

function clean(params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== null),
  );
}

export const authApi = {
  register: (body: { username: string; email: string; password: string }) =>
    api.post<{ success: boolean; data: { user: UserPublic } }>("/auth/register", body),
  login: (body: { identifier: string; password: string }) =>
    api.post<{ success: boolean; data: { user: UserPublic } }>("/auth/login", body),
  logout: () => api.post("/auth/logout"),
  me: () =>
    api.get<{ success: boolean; data: { user: UserPublic } }>("/auth/me"),
  updateProfile: (body: { bio?: string; avatarUrl?: string | null; avatarPublicId?: string }) =>
    api.put<{ success: boolean; data: { user: UserPublic } }>("/users/me", body),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api.put("/users/me/password", body),
};

export const gameDataApi = {
  all: () =>
    api.get<{ success: boolean; data: GameDataBundle }>("/game-data/all"),
};

export const lineupsApi = {
  list: (params: LineupQueryParams) =>
    api.get<{ success: boolean; data: LineupListResponse }>("/lineups", {
      params: clean(params as Record<string, unknown>),
    }),
  featured: () =>
    api.get<{ success: boolean; data: { lineups: Lineup[] } }>("/lineups/featured"),
  bySlug: (slug: string) =>
    api.get<{
      success: boolean;
      data: { lineup: Lineup; viewerRating: number | null; isAuthor: boolean };
    }>(`/lineups/${slug}`),
  byIdForEdit: (id: string) =>
    api.get<{ success: boolean; data: { lineup: Lineup } }>(
      `/lineups/by-id/${id}/edit`,
    ),
  create: (body: Record<string, unknown>) =>
    api.post<{ success: boolean; data: { lineup: Lineup } }>("/lineups", body),
  update: (id: string, body: Record<string, unknown>) =>
    api.put<{ success: boolean; data: { lineup: Lineup } }>(`/lineups/${id}`, body),
  remove: (id: string) => api.delete(`/lineups/${id}`),
  like: (id: string) => api.post(`/lineups/${id}/like`),
  unlike: (id: string) => api.delete(`/lineups/${id}/like`),
  save: (id: string) => api.post(`/lineups/${id}/save`),
  unsave: (id: string) => api.delete(`/lineups/${id}/save`),
  rate: (id: string, rating: number) =>
    api.put(`/lineups/${id}/rating`, { rating }),
  trackView: (id: string) => api.post(`/lineups/${id}/view`),
};

export const commentsApi = {
  list: (lineupId: string, page = 1) =>
    api.get<{
      success: boolean;
      data: { comments: CommentNode[]; pagination: Pagination };
    }>(`/lineups/${lineupId}/comments`, { params: { page } }),
  create: (lineupId: string, content: string, parentComment?: string | null) =>
    api.post<{ success: boolean; data: { comment: CommentNode } }>(
      `/lineups/${lineupId}/comments`,
      { content, parentComment: parentComment ?? null },
    ),
  like: (commentId: string) => api.post(`/comments/${commentId}/like`),
  remove: (commentId: string) => api.delete(`/comments/${commentId}`),
};

export const usersApi = {
  profile: (username: string) =>
    api.get<{
      success: boolean;
      data: { user: UserPublic & { joinedAt: string }; isSelf: boolean; isFollowing: boolean };
    }>(`/users/${username}`),
  lineups: (username: string, page = 1, sort = "newest") =>
    api.get<{ success: boolean; data: LineupListResponse }>(
      `/users/${username}/lineups`,
      { params: { page, sort } },
    ),
  saved: () =>
    api.get<{ success: boolean; data: { lineups: Lineup[] } }>("/users/me/saved"),
  liked: () =>
    api.get<{ success: boolean; data: { lineups: Lineup[] } }>("/users/me/liked"),
  follow: (id: string) => api.post(`/users/${id}/follow`),
  unfollow: (id: string) => api.delete(`/users/${id}/follow`),
};

export const searchApi = {
  suggest: (q: string) =>
    api.get<{ success: boolean; data: { suggestions: Suggestion[] } }>(
      "/search/suggest",
      { params: { q } },
    ),
};

export const reportsApi = {
  create: (body: {
    targetType: "lineup" | "comment" | "user";
    targetId: string;
    reason: string;
    description?: string;
  }) => api.post("/reports", body),
};

export const uploadsApi = {
  image: (file: File, folder: "avatars" | "lineups" | "game-data") => {
    const form = new FormData();
    form.append("image", file);
    form.append("folder", folder);
    return api.post<{ success: boolean; data: { url: string; publicId: string } }>(
      "/uploads/image",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },
};

export interface AdminStats {
  users: number;
  lineups: number;
  publishedLineups: number;
  comments: number;
  pendingReports: number;
  openReports: number;
}

export const adminApi = {
  stats: () =>
    api.get<{ success: boolean; data: { stats: AdminStats } }>("/admin/stats"),
  users: (params: { q?: string; page?: number }) =>
    api.get<{
      success: boolean;
      data: {
        users: Array<UserPublic & { email: string; status: string; joinedAt: string }>;
        pagination: Pagination;
      };
    }>("/admin/users", { params }),
  setUserStatus: (id: string, status: "active" | "banned") =>
    api.patch(`/admin/users/${id}/status`, { status }),
  lineups: (params: { status?: string; q?: string; page?: number }) =>
    api.get<{ success: boolean; data: LineupListResponse }>("/admin/lineups", {
      params,
    }),
  setLineupStatus: (id: string, status: string) =>
    api.patch(`/admin/lineups/${id}/status`, { status }),
  setLineupFeatured: (id: string, featured: boolean) =>
    api.patch(`/admin/lineups/${id}/feature`, { featured }),
  deleteLineup: (id: string) => api.delete(`/admin/lineups/${id}`),
  deleteComment: (id: string) => api.delete(`/admin/comments/${id}`),
  reports: (status: string, page = 1) =>
    api.get<{
      success: boolean;
      data: { reports: ReportItem[]; pagination: Pagination };
    }>("/admin/reports", { params: { status, page } }),
  resolveReport: (
    id: string,
    status: "resolved" | "dismissed",
    resolutionNote = "",
  ) => api.patch(`/admin/reports/${id}`, { status, resolutionNote }),
  createEntity: (entity: string, body: Record<string, unknown>) =>
    api.post(`/admin/game-data/${entity}`, body),
  updateEntity: (entity: string, id: string, body: Record<string, unknown>) =>
    api.put(`/admin/game-data/${entity}/${id}`, body),
  deleteEntity: (entity: string, id: string) =>
    api.delete(`/admin/game-data/${entity}/${id}`),
  deleteEntities: (entity: string, ids: string[]) =>
    api.delete<{ success: boolean; data: { deletedCount: number } }>(
      `/admin/game-data/${entity}`,
      { data: { ids } },
    ),
};
