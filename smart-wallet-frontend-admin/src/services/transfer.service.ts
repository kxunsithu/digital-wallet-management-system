import api from "../lib/axiox";

export const getUserWallet = (userId: number | string) =>
  api.get("wallets", {
    params: {
      per_page: 100,
      include_admin: true,
      user_id: userId,
    },
  });

export const managerTransfer = (data: {
  pin: string;
  receiver_user_id?: number | string;
  receiver_phone?: string;
  receiver_wallet_number?: string;
  amount: number;
  fee?: number;
  description?: string;
}) => api.post("transfers/manager", data);

export const agentTransfer = (data: {
  pin: string;
  receiver_user_id?: number | string;
  receiver_phone?: string;
  receiver_wallet_number?: string;
  amount: number;
  fee?: number;
  description?: string;
}) => api.post("transfers/agent", data);
