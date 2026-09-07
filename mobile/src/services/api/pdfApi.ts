import { apiClient, getApiBaseUrl } from './apiClient';

export const pdfApi = {
  downloadMedicalHistoryPdf: async (options: any = {}): Promise<Blob | ArrayBuffer> => {
    const res = await apiClient.post('/api/medical-history/pdf', options, {
      responseType: 'blob',
    });
    return res.data;
  },

  getPdfDownloadUrl: (): string => {
    return `${getApiBaseUrl()}/api/medical-history/pdf`;
  },
};
