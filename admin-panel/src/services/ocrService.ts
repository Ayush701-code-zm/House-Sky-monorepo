import api from './api';

export const ocrService = {
  analyzeMap: async (formData: FormData) => {
    const response = await api.post('/ocr/analyze', formData);
    return response.data;
  },
  approveMapOverlay: async (mapId: string, updatedVectorOverlayData?: any) => {
    const response = await api.post(`/ocr/approve/${mapId}`, { updatedVectorOverlayData });
    return response.data;
  },
  rejectMapOverlay: async (mapId: string) => {
    const response = await api.post(`/ocr/reject/${mapId}`);
    return response.data;
  },
  getPlotMaps: async () => {
    const response = await api.get('/plot-maps');
    return response.data;
  }
};
