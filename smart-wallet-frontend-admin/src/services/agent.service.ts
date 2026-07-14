import api from "../lib/axiox";

export const getAgents = (params?: {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
  state_region_id?: string;
  township_id?: string;
}) => api.get("agents", { params });

export const getAgent = (id: number | string) => api.get(`agents/${id}`);

export const createAgent = (data: FormData) =>
  api.post("agents", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const updateAgent = (id: number | string, data: FormData | Record<string, unknown>) => {
  if (data instanceof FormData) {
    data.append("_method", "PUT");
    return api.post(`agents/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return api.put(`agents/${id}`, data);
};

export const deleteAgent = (id: number | string) => api.delete(`agents/${id}`);
