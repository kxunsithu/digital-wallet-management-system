import api from "../lib/axiox";

export const getStateRegions = () => api.get("locations/state-regions");
export const createStateRegion = (data: { name: string }) => api.post("locations/state-regions", data);
export const updateStateRegion = (id: number | string, data: { name: string }) => api.put(`locations/state-regions/${id}`, data);
export const deleteStateRegion = (id: number | string) => api.delete(`locations/state-regions/${id}`);

export const getTownships = (params?: { state_region_id?: number | string }) => api.get("locations/townships", { params });
export const createTownship = (data: { state_region_id: number | string; name: string }) => api.post("locations/townships", data);
export const updateTownship = (id: number | string, data: { state_region_id: number | string; name: string }) => api.put(`locations/townships/${id}`, data);
export const deleteTownship = (id: number | string) => api.delete(`locations/townships/${id}`);
