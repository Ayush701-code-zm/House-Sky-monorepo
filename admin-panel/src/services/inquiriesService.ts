import api from './api';

export const inquiriesService = {
  getInquiries: async () => {
    const response = await api.get('/inquiries');
    return response.data;
  },
  updateInquiryStatus: async (id: string, statusData: { status?: string; assignedAgentId?: string }) => {
    const response = await api.put(`/inquiries/${id}/status`, statusData);
    return response.data;
  },
  getBulkBuyInquiries: async () => {
    const response = await api.get('/bulk-buy-inquiries');
    return response.data;
  },
  updateBulkBuyStatus: async (id: string, statusData: { status?: string; assignedAgentId?: string }) => {
    const response = await api.put(`/bulk-buy-inquiries/${id}/status`, statusData);
    return response.data;
  }
};
