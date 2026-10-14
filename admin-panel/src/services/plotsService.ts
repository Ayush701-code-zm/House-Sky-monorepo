import api from './api';
import { Plot } from '../types';

export const plotsService = {
  getPlots: async (params?: { projectId?: string; block?: string; status?: string; search?: string }): Promise<Plot[]> => {
    const response = await api.get('/plots', { params });
    return response.data;
  },
  getPlotById: async (id: string) => {
    const response = await api.get(`/plots/${id}`);
    return response.data;
  },
  updatePlotStatus: async (plotId: string, statusData: any): Promise<Plot> => {
    const response = await api.put(`/plots/${plotId}/status`, statusData);
    return response.data;
  },
  computePricePreview: async (priceInputs: any) => {
    const response = await api.post('/plots/compute-price', priceInputs);
    return response.data;
  },
  importPlotsCSV: async (projectId: string, plotsData: any[]) => {
    const response = await api.post('/plots/import-csv', { projectId, plotsData });
    return response.data;
  },
  exportPlotsCSV: async (projectId?: string) => {
    const response = await api.get('/plots/export-csv', {
      params: { projectId },
      responseType: 'blob'
    });
    return response.data;
  },
  uploadDocument: async (plotId: string, docData: { documentType: string; title: string; fileUrl?: string }) => {
    const response = await api.post(`/plots/${plotId}/documents`, docData);
    return response.data;
  }
};
