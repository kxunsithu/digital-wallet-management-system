import api from "../lib/axios";

export const getTransactions = (params?: Record<string, any>) =>
  api.get("transactions", { params });

export const getTransaction = (id: number | string) => api.get(`transactions/${id}`);

export const getFeeSummary = () => api.get("transactions/fee-summary");

export default { getTransactions, getTransaction, getFeeSummary };
