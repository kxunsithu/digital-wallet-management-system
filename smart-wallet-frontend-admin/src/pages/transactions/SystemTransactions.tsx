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
        <TransactionList pageTitle="System Transactions" filterParams={{ user_id: admin?.id }} />
      </div>
    </MainLayout>
  );
};

export default SystemTransactionsPage;
