import api from "../lib/axios";

export const getWallets = (params?: {
  page?: number;
  per_page?: number;
  status?: string;
  role?: string;
  include_admin?: boolean;
  admin_id?: number | string;
  user_id?: number | string;
}) => api.get("wallets", { params });

export const getWallet = (id: number | string) => api.get(`wallets/${id}`);

export const toggleWalletStatus = (id: number | string) => api.post(`wallets/${id}/toggle-status`);
