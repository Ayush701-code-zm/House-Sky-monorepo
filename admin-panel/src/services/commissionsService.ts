import api from './api';
import { Commission } from '../types';

export const commissionsService = {
  getCommissions: async (params?: { employeeId?: string; status?: string }): Promise<Commission[]> => {
    const response = await api.get('/commissions', { params });
    return response.data;
  },
  getCommissionSummary: async () => {
    const response = await api.get('/commissions/summary');
    return response.data;
  }
};
