const WebSocket = require('ws');
const { EVENTS } = require('../../../shared/constants');

/**
 * The bot connects OUTBOUND to the backend — it never listens on a public
 * port. Auth is a shared secret header; in production put this behind a
 * private network / VPC as well, the header is defense-in-depth, not the
 * only barrier.
 */
class BackendClient {
  constructor({ url, secret, actionHandlers }) {
    // Accept either a bare origin (ws://host:port) or one that already
    // includes the path — normalize so callers can pass either.
    this.url = url.endsWith('/internal-ws') ? url : `${url.replace(/\/$/, '')}/internal-ws`;
    this.secret = secret;
    this.actionHandlers = actionHandlers; // { [actionType]: async (guildId, payload) => resultPayload }
    this.ws = null;
    this.reconnectDelayMs = 1000;
  }

  connect() {
    this.ws = new WebSocket(this.url, { headers: { 'x-internal-secret': this.secret } });

    this.ws.on('open', () => {
      console.log('[backend-client] connected to backend');
      this.reconnectDelayMs = 1000;
      this.emit(EVENTS.BOT_READY, 'GLOBAL', { at: new Date().toISOString() });
    });

    this.ws.on('message', async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (msg.type !== 'action') return;

      const handler = this.actionHandlers[msg.action];
      let payload;
      if (!handler) {
        payload = { success: false, error: `No handler for action ${msg.action}` };
      } else {
        try {
          payload = await handler(msg.guildId, msg.payload);
        } catch (err) {
          payload = { success: false, error: err.message };
        }
      }
      this.ws.send(JSON.stringify({ type: 'response', requestId: msg.requestId, payload }));
    });

    this.ws.on('close', () => {
      console.warn('[backend-client] disconnected, retrying...');
      this._scheduleReconnect();
    });

    this.ws.on('error', (err) => {
      console.error('[backend-client] error:', err.message);
    });
  }

  _scheduleReconnect() {
    setTimeout(() => this.connect(), this.reconnectDelayMs);
    this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, 30_000);
  }

  /** Push a realtime event (detection, log entry, status) to the backend. */
  emit(event, guildId, payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'event', event, guildId, payload }));
    }
  }
}

module.exports = { BackendClient };
