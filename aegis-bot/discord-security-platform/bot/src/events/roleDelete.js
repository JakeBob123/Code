const { AuditLogEvent } = require('discord.js');
const { EVENTS } = require('../../../shared/constants');
const { resolveExecutor } = require('../utils/resolveExecutor');
const antiNuke = require('../security/antiNuke');
const configCache = require('../security/configCache');

module.exports = {
  name: 'roleDelete',
  async execute(role, { backendClient }) {
    const executorId = await resolveExecutor(role.guild, AuditLogEvent.RoleDelete, role.id);
    if (!executorId) return;

    backendClient.emit(EVENTS.ROLE_CHANGE, role.guild.id, {
      type: 'DELETE',
      roleId: role.id,
      roleName: role.name,
      executorId,
    });

    const check = await antiNuke.checkAntiNuke(role.guild, executorId, 'ROLE_DELETE', {
      enabledFlag: 'antiRoleDeleteEnabled',
    });
    if (!check.triggered) return;

    const config = configCache.getSecurity(role.guild.id);
    const punishResult = await antiNuke.punishExecutor(
      role.guild,
      executorId,
      config.punishmentAction,
      'Mass role deletion detected'
    );

    backendClient.emit(EVENTS.NUKE_ATTEMPT_BLOCKED, role.guild.id, {
      type: 'ROLE_DELETE',
      executorId,
      ...punishResult,
    });
  },
};
