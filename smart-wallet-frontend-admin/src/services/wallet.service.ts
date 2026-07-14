import api from "../lib/axiox";

export const getWallets = (params?: { page?: number; per_page?: number; status?: string; role?: string }) =>
  api.get("wallets", { params });

export const getWallet = (id: number | string) => api.get(`wallets/${id}`);

export const toggleWalletStatus = (id: number | string) => api.post(`wallets/${id}/toggle-status`);
