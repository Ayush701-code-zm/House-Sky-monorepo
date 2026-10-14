import api from './api';
import { Project } from '../types';

export const projectsService = {
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get('/projects');
    return response.data;
  },
  getProjectById: async (id: string): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },
  createProject: async (projectData: Partial<Project>): Promise<Project> => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },
  updateProject: async (id: string, projectData: Partial<Project>): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },
  deleteProject: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },
  updateProjectSettings: async (projectId: string, settings: any) => {
    const response = await api.put(`/projects/${projectId}/settings`, settings);
    return response.data;
  }
};
