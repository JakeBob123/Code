/**
 * Detection logic (antiNuke, antiRaid, automod) needs to read config on
 * every event without hitting the backend each time. This cache is
 * populated on startup (fetch once per guild) and pushed live whenever the
 * dashboard changes a setting (see ACTIONS.CONFIG_UPDATE in actions.js).
 */
const securityConfigs = new Map(); // guildId -> SecurityConfig
const automodConfigs = new Map(); // guildId -> AutomodConfig
const automodRules = new Map(); // guildId -> AutomodRule[]

const DEFAULT_SECURITY = {
  antiNukeEnabled: true,
  antiRaidEnabled: true,
  antiMassBanEnabled: true,
  antiMassKickEnabled: true,
  antiChannelDeleteEnabled: true,
  antiChannelCreateEnabled: false,
  antiRoleDeleteEnabled: true,
  antiRoleCreateEnabled: false,
  antiPermissionAbuseEnabled: true,
  antiWebhookAbuseEnabled: true,
  antiBotAbuseEnabled: true,
  joinProtectionEnabled: true,
  minAccountAgeMinutes: 0,
  massActionThreshold: 5,
  massActionWindowSeconds: 10,
  raidJoinThreshold: 10,
  raidJoinWindowSeconds: 30,
  punishmentAction: 'QUARANTINE',
  lockdownActive: false,
};

const DEFAULT_AUTOMOD = {
  spamDetectionEnabled: true,
  floodDetectionEnabled: true,
  mentionSpamEnabled: true,
  mentionSpamLimit: 5,
  linkFilterEnabled: false,
  inviteFilterEnabled: true,
  wordFilterEnabled: false,
  capsFilterEnabled: false,
  capsPercentThreshold: 70,
  emojiSpamEnabled: true,
  emojiSpamLimit: 10,
  duplicateMessageEnabled: true,
};

function getSecurity(guildId) {
  return securityConfigs.get(guildId) || DEFAULT_SECURITY;
}

function getAutomod(guildId) {
  return automodConfigs.get(guildId) || DEFAULT_AUTOMOD;
}

function getRules(guildId) {
  return automodRules.get(guildId) || [];
}

function update(guildId, { securityConfig, automodConfig }) {
  if (securityConfig) securityConfigs.set(guildId, securityConfig);
  if (automodConfig) automodConfigs.set(guildId, automodConfig);
}

function upsertRule(guildId, rule) {
  const rules = automodRules.get(guildId) || [];
  const idx = rules.findIndex((r) => r.id === rule.id);
  if (idx >= 0) rules[idx] = rule;
  else rules.push(rule);
  automodRules.set(guildId, rules);
}

module.exports = { getSecurity, getAutomod, getRules, update, upsertRule };
