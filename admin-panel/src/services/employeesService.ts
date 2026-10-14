import api from './api';
import { Employee, MLMTreeNode } from '../types';

export const employeesService = {
  getEmployees: async (): Promise<Employee[]> => {
    const response = await api.get('/employees');
    return response.data;
  },
  getEmployeeById: async (id: string): Promise<Employee> => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },
  createEmployee: async (data: any): Promise<Employee> => {
    const response = await api.post('/employees', data);
    return response.data;
  },
  updateEmployee: async (id: string, data: any): Promise<Employee> => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },
  deleteEmployee: async (id: string) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },
  approveAgent: async (id: string) => {
    const response = await api.post(`/employees/${id}/approve`);
    return response.data;
  },
  rejectAgent: async (id: string) => {
    const response = await api.post(`/employees/${id}/reject`);
    return response.data;
  },
  evaluateRank: async (id: string) => {
    const response = await api.post(`/mlm/evaluate-rank/${id}`);
    return response.data;
  },
  getMLMTree: async (rootEmployeeId?: string): Promise<MLMTreeNode> => {
    // Backend reads the root from `rootId` (see mlmController.getTree).
    const response = await api.get('/mlm/tree', { params: { rootId: rootEmployeeId } });
    return response.data;
  },
  getRankRules: async () => {
    const response = await api.get('/mlm/rank-rules');
    return response.data;
  },
  getMLMSummary: async () => {
    const response = await api.get('/mlm/summary');
    return response.data;
  }
};
