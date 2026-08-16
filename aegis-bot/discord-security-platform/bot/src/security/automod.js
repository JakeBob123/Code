const configCache = require('./configCache');

// guildId:userId -> recent message timestamps (flood detection)
const messageWindows = new Map();
// guildId:userId -> last message content (duplicate detection)
const lastMessages = new Map();

const INVITE_REGEX = /(discord\.gg|discord(?:app)?\.com\/invite)\/[a-zA-Z0-9-]+/i;
const LINK_REGEX = /https?:\/\/[^\s]+/gi;

/**
 * Evaluates a single message against the guild's AutoMod config and
 * returns the first violation found (if any), so the caller can act (delete
 * the message, warn/timeout/kick/ban the author) and log it. Rules are
 * checked cheapest-first.
 */
function evaluateMessage(message) {
  const config = configCache.getAutomod(message.guildId);
  const content = message.content || '';
  const key = `${message.guildId}:${message.author.id}`;

  if (config.inviteFilterEnabled && INVITE_REGEX.test(content)) {
    return { violation: 'INVITE_LINK', action: 'DELETE' };
  }

  if (config.linkFilterEnabled && LINK_REGEX.test(content)) {
    return { violation: 'LINK', action: 'DELETE' };
  }

  if (config.mentionSpamEnabled) {
    const mentionCount = message.mentions.users.size + message.mentions.roles.size;
    if (mentionCount >= config.mentionSpamLimit) {
      return { violation: 'MENTION_SPAM', action: 'TIMEOUT' };
    }
  }

  if (config.capsFilterEnabled && content.length >= 10) {
    const letters = content.replace(/[^a-zA-Z]/g, '');
    const caps = content.replace(/[^A-Z]/g, '');
    if (letters.length > 0 && (caps.length / letters.length) * 100 >= config.capsPercentThreshold) {
      return { violation: 'EXCESSIVE_CAPS', action: 'DELETE' };
    }
  }

  if (config.emojiSpamEnabled) {
    const emojiMatches = content.match(/<a?:\w+:\d+>|\p{Extended_Pictographic}/gu) || [];
    if (emojiMatches.length >= config.emojiSpamLimit) {
      return { violation: 'EMOJI_SPAM', action: 'DELETE' };
    }
  }

  if (config.duplicateMessageEnabled) {
    const last = lastMessages.get(key);
    lastMessages.set(key, content);
    if (last && last === content && content.length > 0) {
      return { violation: 'DUPLICATE_MESSAGE', action: 'DELETE' };
    }
  }

  if (config.floodDetectionEnabled || config.spamDetectionEnabled) {
    const now = Date.now();
    const windowMs = 8000;
    const floodLimit = 6; // messages within windowMs
    const timestamps = (messageWindows.get(key) || []).filter((t) => now - t < windowMs);
    timestamps.push(now);
    messageWindows.set(key, timestamps);
    if (timestamps.length >= floodLimit) {
      return { violation: 'MESSAGE_FLOOD', action: 'TIMEOUT' };
    }
  }

  return null;
}

/** Custom word/link rules configured per-guild from the dashboard. */
function evaluateCustomRules(message) {
  const rules = configCache.getRules(message.guildId).filter((r) => r.enabled);
  const content = (message.content || '').toLowerCase();

  for (const rule of rules) {
    if (rule.type === 'WORD_FILTER' && content.includes(rule.pattern.toLowerCase())) {
      return { violation: 'CUSTOM_WORD_FILTER', action: rule.action, rule };
    }
    if (rule.type === 'LINK_BLACKLIST' && content.includes(rule.pattern.toLowerCase())) {
      return { violation: 'CUSTOM_LINK_BLACKLIST', action: rule.action, rule };
    }
  }
  return null;
}

module.exports = { evaluateMessage, evaluateCustomRules };
