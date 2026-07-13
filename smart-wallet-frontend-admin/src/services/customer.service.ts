import api from "../lib/axiox";

export const getCustomers = (params?: {
  page?: number;
  per_page?: number;
  search?: string;
  kyc_status?: string;
  level?: string;
  state_region_id?: string;
  township_id?: string;
}) => api.get("customers", { params });

export const getCustomer = (id: number | string) => api.get(`customers/${id}`);

export const verifyCustomerNrc = (verificationId: number | string) =>
  api.post(`admin/nrc-verifications/${verificationId}/verify`, { status: 'approved' });

export const rejectCustomerNrc = (
  verificationId: number | string,
  rejectionReason?: string
) => api.post(`admin/nrc-verifications/${verificationId}/reject`, {
  rejection_reason: rejectionReason || null,
});

export const deleteCustomer = (id: number | string) => api.delete(`customers/${id}`);

export const getCustomerLevels = () => api.get("admin/levels/customers");
