import api from './api';
import { Payout } from '../types';

export const payoutsService = {
  getPayouts: async (): Promise<Payout[]> => {
    const response = await api.get('/payouts');
    return response.data;
  },
  requestPayout: async (data?: { employeeId?: string; bankDetails?: any }): Promise<Payout> => {
    const response = await api.post('/payouts/request', data || {});
    return response.data;
  },
  approvePayout: async (payoutId: string) => {
    const response = await api.post(`/payouts/${payoutId}/approve`);
    return response.data;
  }
};
