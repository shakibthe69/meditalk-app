import { apiClient } from './apiClient';
import { DiseaseCategory, DiseaseSummary, DiseaseDetail } from '../../types';

export const diseaseApi = {
  getCategories: async (): Promise<DiseaseCategory[]> => {
    const res = await apiClient.get('/api/diseases/categories');
    return res.data.data;
  },

  getPopularDiseases: async (): Promise<DiseaseSummary[]> => {
    const res = await apiClient.get('/api/diseases/popular');
    return res.data.data;
  },

  searchDiseases: async (query: string, page: number = 0, size: number = 20): Promise<{ content: DiseaseSummary[]; totalElements: number; totalPages: number }> => {
    const res = await apiClient.get('/api/diseases/search', {
      params: { q: query, page, size },
    });
    return res.data.data;
  },

  getDiseasesByCategory: async (categoryId: number, page: number = 0, size: number = 20): Promise<{ content: DiseaseSummary[]; totalElements: number; totalPages: number }> => {
    const res = await apiClient.get(`/api/diseases/category/${categoryId}`, {
      params: { page, size },
    });
    return res.data.data;
  },

  getDiseaseById: async (id: number): Promise<DiseaseDetail> => {
    const res = await apiClient.get(`/api/diseases/${id}`);
    return res.data.data;
  },

  getDiseaseBySlug: async (slug: string): Promise<DiseaseDetail> => {
    const res = await apiClient.get(`/api/diseases/slug/${slug}`);
    return res.data.data;
  },
};
