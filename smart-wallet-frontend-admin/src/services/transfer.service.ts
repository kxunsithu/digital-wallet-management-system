import api from "../lib/axiox";

export const getUserWallet = (userId: number | string) =>
  api.get("wallets", {
    params: {
      per_page: 100,
      include_admin: true,
      user_id: userId,
    },
  });

export type TransferPayload = {
  pin: string;
  receiver_user_id?: number | string;
  receiver_phone?: string;
  receiver_wallet_number?: string;
  qr_id?: number | string;
  amount: number;
  fee?: number;
  description?: string;
};

/** Used by Agent Managers: can send to agents OR admin */
export const managerTransfer = (data: TransferPayload) =>
  api.post("transfers/manager", data);

export const agentTransfer = (data: TransferPayload) =>
  api.post("transfers/agent", data);

/** Fetch admin wallet info so the manager can send money to the admin */
export const getAdminWalletInfo = () =>
  api.get("wallets", {
    params: { per_page: 10, include_admin: true, role: "admin" },
  });
