import { apiClient } from './apiClient';
import { CallSession } from '../../types';
import { IceServersResponse } from '../webrtc/types';

export const callApi = {
  /** Every call the signed-in user took part in, newest first. */
  getHistory: async (): Promise<CallSession[]> => {
    const res = await apiClient.get('/api/calls/history');
    return res.data.data;
  },

  /**
   * ICE servers for the peer connection. Fetched from the backend so TURN
   * credentials are never bundled into the app.
   */
  getIceServers: async (): Promise<IceServersResponse> => {
    const res = await apiClient.get('/api/calls/ice-servers');
    return res.data.data;
  },
};
