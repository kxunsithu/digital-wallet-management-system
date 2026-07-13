import api from "../lib/axiox";

export const getAgentManagers = () => api.get("agent-managers");

export const getAdminWallet = (adminId?: number | string) =>
  api.get("wallets", {
    params: {
      per_page: 100,
      include_admin: true,
      admin_id: adminId,
    },
  });

export const adminTransferToAgentManager = (data: {
  pin: string;
  receiver_user_id?: number | string;
  receiver_phone?: string;
  receiver_wallet_number?: string;
  amount: number;
  fee?: number;
  description?: string;
}) => api.post("transfers/admin", data);
