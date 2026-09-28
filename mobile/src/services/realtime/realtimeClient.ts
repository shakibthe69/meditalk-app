import { getApiBaseUrl } from '../api/apiClient';
import { RealtimeOutbound, RealtimeStatus } from '../../types';

type EventHandler = (payload: any) => void;
type StatusHandler = (status: RealtimeStatus) => void;

const MAX_RECONNECT_DELAY_MS = 10000;
const HEARTBEAT_INTERVAL_MS = 25000;

/**
 * The app's single WebSocket connection to the MediTalk backend (`/ws/chat`).
 *
 * - Authenticates with the JWT as a query parameter (native sockets cannot set
 *   an Authorization header on the handshake).
 * - Reconnects automatically with capped exponential backoff.
 * - Keeps the link warm with a heartbeat so proxies do not drop an idle socket.
 * - Exposes a tiny typed event bus keyed by the server's event `type`.
 */
class RealtimeClient {
  private socket: WebSocket | null = null;
  private token: string | null = null;

  private handlers = new Map<string, Set<EventHandler>>();
  private statusHandlers = new Set<StatusHandler>();

  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  private shouldReconnect = false;
  private _status: RealtimeStatus = 'disconnected';

  get status(): RealtimeStatus {
    return this._status;
  }

  isConnected(): boolean {
    return this._status === 'connected' && this.socket?.readyState === WebSocket.OPEN;
  }

  /** Open (or reuse) the connection for a given JWT. */
  connect(token: string) {
    if (!token) return;

    const alreadyOpen =
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING);

    if (this.token === token && alreadyOpen) {
      return;
    }

    this.token = token;
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    this.open();
  }

  /** Close the connection and stop reconnecting (call on logout). */
  disconnect() {
    this.shouldReconnect = false;
    this.token = null;
    this.clearTimers();
    this.reconnectAttempts = 0;

    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      try {
        socket.close();
      } catch {
        // already closed
      }
    }
    this.setStatus('disconnected');
  }

  /** Subscribe to one server event type. Returns an unsubscribe function. */
  on(type: string, handler: EventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => this.off(type, handler);
  }

  off(type: string, handler: EventHandler) {
    this.handlers.get(type)?.delete(handler);
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    handler(this._status);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  /** Send a command. Returns false when the socket is down (caller should fall back). */
  send(command: RealtimeOutbound): boolean {
    if (!this.isConnected() || !this.socket) {
      return false;
    }
    try {
      this.socket.send(JSON.stringify(command));
      return true;
    } catch {
      return false;
    }
  }

  // ---------- internals ----------

  private open() {
    this.clearTimers();

    if (!this.token) return;

    this.setStatus('connecting');

    let socket: WebSocket;
    try {
      socket = new WebSocket(this.buildUrl(this.token));
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.setStatus('connected');
      this.startHeartbeat();
    };

    socket.onmessage = (event: WebSocketMessageEvent) => {
      let envelope: { type?: string; payload?: any };
      try {
        envelope = JSON.parse(typeof event.data === 'string' ? event.data : String(event.data));
      } catch {
        return;
      }
      if (!envelope?.type) return;
      this.emit(envelope.type, envelope.payload);
    };

    socket.onerror = () => {
      // `onclose` always follows and handles the retry.
    };

    socket.onclose = () => {
      this.stopHeartbeat();
      if (this.socket === socket) {
        this.socket = null;
      }
      this.setStatus('disconnected');
      this.scheduleReconnect();
    };
  }

  private buildUrl(token: string): string {
    const base = getApiBaseUrl().replace(/\/+$/, '');
    const wsBase = base.replace(/^http/i, 'ws');
    return `${wsBase}/ws/chat?token=${encodeURIComponent(token)}`;
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect || !this.token) return;
    if (this.reconnectTimer) return;

    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, MAX_RECONNECT_DELAY_MS);
    this.reconnectAttempts += 1;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect) {
        this.open();
      }
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private clearTimers() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
  }

  private setStatus(status: RealtimeStatus) {
    if (this._status === status) return;
    this._status = status;
    this.statusHandlers.forEach((handler) => {
      try {
        handler(status);
      } catch {
        // a broken listener must not break the socket
      }
    });
  }

  private emit(type: string, payload: any) {
    this.handlers.get(type)?.forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        console.warn(`Realtime handler for "${type}" threw:`, err);
      }
    });
  }
}

export const realtimeClient = new RealtimeClient();

export type { RealtimeStatus };
