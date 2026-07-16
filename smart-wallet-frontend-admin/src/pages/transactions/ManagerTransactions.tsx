import AgentManagerLayout from "@/components/layouts/AgentManagerLayout";
import TransactionList from "./TransactionList";
import { getCookie } from "@/lib/cookies";

const ManagerTransactionsPage = () => {
  const getUser = () => {
    try {
      const cookie = getCookie("admin_user");
      return cookie ? JSON.parse(cookie) : null;
    } catch {
      return null;
    }
  };

  const user = getUser();

  return (
    <AgentManagerLayout title="My Transactions">
      <div className="space-y-6">
        <TransactionList pageTitle="My Transactions" filterParams={{ user_id: user?.id }} />
      </div>
    </AgentManagerLayout>
  );
};

export default ManagerTransactionsPage;
