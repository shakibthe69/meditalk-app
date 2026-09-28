import { apiClient } from './apiClient';

/**
 * App-usage heartbeat.
 *
 * The backend's activity interceptor already records activity on normal API
 * calls, but a user who keeps the app open on the dashboard still needs to be
 * seen as active — so the client also posts this on launch and on a timer.
 * Feeds the admin inactivity/follow-up signal (a follow-up signal only, never
 * a medical fact).
 */
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

export const activityApi = {
  heartbeat: async (): Promise<void> => {
    await apiClient.post('/api/activity/heartbeat');
  },

  /** Start posting a heartbeat every 5 minutes (no-op if already running). */
  startHeartbeats: (): void => {
    if (heartbeatTimer) return;
    activityApi.heartbeat().catch(() => {
      // best effort — the interceptor will record activity on the next call
    });
    heartbeatTimer = setInterval(() => {
      activityApi.heartbeat().catch(() => undefined);
    }, HEARTBEAT_INTERVAL_MS);
  },

  stopHeartbeats: (): void => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  },
};
