import api from "../lib/axios";

export const getMerchants = (params?: Record<string, any>) =>
  api.get("merchants", { params });

export const getMerchant = (id: number | string) => api.get(`merchants/${id}`);

export const createMerchant = (data: {
  merchant_name: string;
  phone_number?: string;
  callback_url?: string;
}) => api.post("merchants", data);

export const updateMerchant = (id: number | string, data: Record<string, any>) =>
  api.put(`merchants/${id}`, data);

export const deleteMerchant = (id: number | string) =>
  api.delete(`merchants/${id}`);

export const toggleMerchantStatus = (id: number | string) =>
  api.post(`merchants/${id}/toggle-status`);

export const getMerchantPayments = (
  id: number | string,
  params?: Record<string, any>,
) => api.get(`merchants/${id}/payments`, { params });

export default {
  getMerchants,
  getMerchant,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  toggleMerchantStatus,
  getMerchantPayments,
};
