import api from "../lib/axios";

export type TransferSettings = {
  id?: number;
  unverified_customer_transfer_limit?: number | null;
  customer_transfer_fee_percent?: number;
  merchant_payment_fee_percent?: number;
};

export const getTransferSettings = () => api.get("transfer-settings");

export const updateTransferSettings = (data: {
  unverified_customer_transfer_limit?: number | null;
  customer_transfer_fee_percent: number;
  merchant_payment_fee_percent: number;
}) => api.put("transfer-settings", data);

export default { getTransferSettings, updateTransferSettings };
