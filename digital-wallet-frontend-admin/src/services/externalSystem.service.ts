import api from "../lib/axios";

export const getExternalSystems = (params?: {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
}) => api.get("external-systems", { params });

export const getExternalSystem = (id: number | string) => api.get(`external-systems/${id}`);

export const updateExternalSystem = (
  id: number | string,
  data: { name?: string; system_link?: string | null; status?: string }
) => api.put(`external-systems/${id}`, data);

export const deleteExternalSystem = (id: number | string) => api.delete(`external-systems/${id}`);

export const toggleExternalSystemStatus = (id: number | string) =>
  api.post(`external-systems/${id}/toggle-status`);
