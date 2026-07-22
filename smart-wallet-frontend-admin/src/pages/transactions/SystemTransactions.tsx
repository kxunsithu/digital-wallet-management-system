import { Server } from "lucide-react";
import MainLayout from "@/components/layouts/MainLayout";
import TransactionList from "./TransactionList";
import { getCookie } from "@/lib/cookies";

const SystemTransactionsPage = () => {
  const getAdmin = () => {
    try {
      const cookie = getCookie("admin_user");
      return cookie ? JSON.parse(cookie) : null;
    } catch {
      return null;
    }
  };

  const admin = getAdmin();

  return (
    <MainLayout title="System Transactions">
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#D5E726] text-[#10110E]">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">System Transactions</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                View all transactions made by the system admin account — top-ups, fee collections, and admin transfers.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#D5E726] bg-[#D5E726] px-3 py-1.5 text-xs font-bold text-[#10110E]">
              Admin View
            </span>
            <span className="rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              System Ledger
            </span>
          </div>
        </div>

        <TransactionList
          pageTitle="System Transactions"
          filterParams={{ user_id: admin?.id }}
        />
      </div>
    </MainLayout>
  );
};

export default SystemTransactionsPage;
