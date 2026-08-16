'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeEvent } from './types';

const WS_ORIGIN = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
const WS_URL = WS_ORIGIN.endsWith('/public-ws') ? WS_ORIGIN : `${WS_ORIGIN.replace(/\/$/, '')}/public-ws`;

/**
 * Subscribes to realtime events for one guild. The backend only admits the
 * subscription if the guild is in `authorizedGuildIds` — which the caller
 * must have already obtained from a permission-checked REST call (see
 * ServerShell, which fetches /overview — itself gated by
 * requireGuildPermission — before mounting anything that subscribes).
 *
 * Returns the connection status plus a rolling feed of received events,
 * newest first, so components can react to specific event types.
 */
export function useGuildRealtime(guildId: string | null) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!guildId) return;

    let cancelled = false;
    let reconnectDelay = 1000;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        setConnected(true);
        reconnectDelay = 1000;
        ws.send(JSON.stringify({ type: 'subscribe', guildId, authorizedGuildIds: [guildId] }));
      };

      ws.onmessage = (raw) => {
        try {
          const msg = JSON.parse(raw.data);
          if (msg.type === 'event') {
            setEvents((prev) => [{ event: msg.event, guildId: msg.guildId, payload: msg.payload }, ...prev].slice(0, 50));
          }
        } catch {
          /* ignore malformed frames */
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        reconnectTimer = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [guildId]);

  return { connected, events };
}
