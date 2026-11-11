import api from './api';

type Listener = (isOpen: boolean) => void;
const listeners = new Set<Listener>();

export const openBugReportModal = () => {
  listeners.forEach((listener) => listener(true));
};

export const closeBugReportModal = () => {
  listeners.forEach((listener) => listener(false));
};

export const subscribeBugReportModal = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export interface BugReportPayload {
  section: string;
  summary: string;
  steps: string;
  deviceInfo?: string;
  pageUrl?: string;
}

export const submitBugReportApi = async (payload: BugReportPayload) => {
  const response = await api.post('/reports', payload);
  return response.data;
};

export const getAdminBugReportsApi = async (params?: { page?: number; limit?: number; status?: string }) => {
  const response = await api.get('/admin/reports', { params });
  return response.data;
};

export const updateBugReportStatusApi = async (id: number, status: string, adminNotes?: string) => {
  const response = await api.patch(`/admin/reports/${id}/status`, { status, adminNotes });
  return response.data;
};
