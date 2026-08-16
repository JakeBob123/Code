const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * All requests go with credentials: 'include' so the httpOnly session
 * cookie set by /api/auth/discord/callback rides along automatically.
 * The backend re-verifies permissions on every guild-scoped call — this
 * client never assumes an action is authorized just because a button is
 * visible.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      /* non-JSON error body, fall back to default message */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Auth
  manageableGuilds: () => request<{ guilds: import('./types').ManageableGuild[] }>('/api/auth/discord/manageable-guilds'),
  logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST' }),

  // Overview
  overview: (guildId: string) => request<import('./types').GuildOverview>(`/api/servers/${guildId}/overview`),

  // Security
  getSecurityConfig: (guildId: string) => request<{ config: import('./types').SecurityConfig | null }>(`/api/servers/${guildId}/security`),
  updateSecurityConfig: (guildId: string, patch: Partial<import('./types').SecurityConfig>) =>
    request<{ config: import('./types').SecurityConfig }>(`/api/servers/${guildId}/security`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  enableLockdown: (guildId: string) => request(`/api/servers/${guildId}/security/lockdown/enable`, { method: 'POST' }),
  disableLockdown: (guildId: string) => request(`/api/servers/${guildId}/security/lockdown/disable`, { method: 'POST' }),

  // AutoMod
  getAutomod: (guildId: string) =>
    request<{ config: import('./types').AutomodConfig | null; rules: import('./types').AutomodRule[] }>(`/api/servers/${guildId}/automod`),
  updateAutomodConfig: (guildId: string, patch: Partial<import('./types').AutomodConfig>) =>
    request<{ config: import('./types').AutomodConfig }>(`/api/servers/${guildId}/automod`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  createAutomodRule: (guildId: string, rule: Pick<import('./types').AutomodRule, 'type' | 'pattern' | 'action'>) =>
    request<{ rule: import('./types').AutomodRule }>(`/api/servers/${guildId}/automod/rules`, {
      method: 'POST',
      body: JSON.stringify(rule),
    }),
  deleteAutomodRule: (guildId: string, ruleId: string) =>
    request<{ ok: true }>(`/api/servers/${guildId}/automod/rules/${ruleId}`, { method: 'DELETE' }),

  // Moderation
  banUser: (guildId: string, userId: string, reason?: string) =>
    request<{ ok: true }>(`/api/servers/${guildId}/moderation/ban`, {
      method: 'POST',
      body: JSON.stringify({ userId, reason }),
    }),
  moderationHistory: (guildId: string, userId?: string) =>
    request<{ punishments: import('./types').Punishment[] }>(
      `/api/servers/${guildId}/moderation/history${userId ? `?userId=${userId}` : ''}`
    ),

  // Logs
  logs: (guildId: string, params: { category?: string; cursor?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set('category', params.category);
    if (params.cursor) qs.set('cursor', params.cursor);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ logs: import('./types').AuditLogEntry[]; nextCursor: string | null }>(
      `/api/servers/${guildId}/logs${suffix}`
    );
  },

  // Server management
  management: (guildId: string) => request<import('./types').ManagementData>(`/api/servers/${guildId}/management`),
};

export { API_URL };
