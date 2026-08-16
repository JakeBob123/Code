export interface ManageableGuild {
  id: string;
  name: string;
  icon: string | null;
}

export interface SecurityConfig {
  guildId: string;
  antiNukeEnabled: boolean;
  antiRaidEnabled: boolean;
  antiMassBanEnabled: boolean;
  antiMassKickEnabled: boolean;
  antiChannelDeleteEnabled: boolean;
  antiChannelCreateEnabled: boolean;
  antiRoleDeleteEnabled: boolean;
  antiRoleCreateEnabled: boolean;
  antiPermissionAbuseEnabled: boolean;
  antiWebhookAbuseEnabled: boolean;
  antiBotAbuseEnabled: boolean;
  joinProtectionEnabled: boolean;
  minAccountAgeMinutes: number;
  lockdownActive: boolean;
  massActionThreshold: number;
  massActionWindowSeconds: number;
  raidJoinThreshold: number;
  raidJoinWindowSeconds: number;
  punishmentAction: 'QUARANTINE' | 'KICK' | 'BAN' | 'STRIP_ROLES';
}

export interface AutomodConfig {
  guildId: string;
  spamDetectionEnabled: boolean;
  floodDetectionEnabled: boolean;
  mentionSpamEnabled: boolean;
  mentionSpamLimit: number;
  linkFilterEnabled: boolean;
  inviteFilterEnabled: boolean;
  wordFilterEnabled: boolean;
  capsFilterEnabled: boolean;
  capsPercentThreshold: number;
  emojiSpamEnabled: boolean;
  emojiSpamLimit: number;
  duplicateMessageEnabled: boolean;
}

export interface AutomodRule {
  id: string;
  guildId: string;
  type: 'WORD_FILTER' | 'LINK_WHITELIST' | 'LINK_BLACKLIST';
  pattern: string;
  action: 'DELETE' | 'WARN' | 'TIMEOUT' | 'KICK' | 'BAN';
  enabled: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  guildId: string;
  category: 'MODERATION' | 'SECURITY' | 'AUTOMOD' | 'CONFIG' | 'AUTH' | 'BOT';
  action: string;
  actorId: string | null;
  actorType: 'USER' | 'BOT' | 'SYSTEM';
  targetId: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface Punishment {
  id: string;
  guildId: string;
  userId: string;
  type: 'BAN' | 'KICK' | 'TIMEOUT' | 'WARN' | 'SOFTBAN';
  reason: string | null;
  issuedBy: string;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

export interface GuildOverview {
  guildId: string;
  botConnected: boolean;
  lockdownActive: boolean;
  activePunishments: number;
  recentEvents: AuditLogEntry[];
}

export interface GuildRole {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
  managed: boolean;
}

export interface GuildChannel {
  id: string;
  name: string;
  type: number;
  position: number;
}

export interface ManagementData {
  guildId: string;
  name: string;
  ownerId: string;
  memberCount: number | null;
  roles: GuildRole[];
  channels: GuildChannel[];
}

export type RealtimeEvent =
  | { event: 'security.raid_detected'; guildId: string; payload: { accountsDetected: number; accountsBlocked: number; accountsKicked: number; detectionTime: string } }
  | { event: 'security.nuke_attempt_blocked'; guildId: string; payload: { type: string; executorId: string; punished: boolean } }
  | { event: 'moderation.action'; guildId: string; payload: { type: string; userId: string; issuedBy: string; reason?: string } }
  | { event: 'automod.trigger'; guildId: string; payload: { userId: string; violation: string; action: string } }
  | { event: 'config.security_updated'; guildId: string; payload: SecurityConfig }
  | { event: 'config.automod_updated'; guildId: string; payload: AutomodConfig }
  | { event: 'security.lockdown_enabled'; guildId: string; payload: Record<string, never> }
  | { event: 'security.lockdown_disabled'; guildId: string; payload: Record<string, never> }
  | { event: string; guildId: string; payload: unknown };
