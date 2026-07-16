import api from "../lib/axiox";

export const getTransactions = (params?: Record<string, any>) =>
  api.get("transactions", { params });

export const getTransaction = (id: number | string) => api.get(`transactions/${id}`);

export default { getTransactions, getTransaction };
