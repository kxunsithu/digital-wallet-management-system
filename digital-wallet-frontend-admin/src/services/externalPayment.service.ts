import api from "../lib/axios";

export const getExternalPayments = (params?: {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
}) => api.get("external-payments", { params });

export const getExternalPayment = (id: number | string) => api.get(`external-payments/${id}`);
