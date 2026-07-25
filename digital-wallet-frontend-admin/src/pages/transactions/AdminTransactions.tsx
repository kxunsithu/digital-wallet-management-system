import MainLayout from "@/components/layouts/MainLayout";
import TransactionList from "./TransactionList";
 
const AdminTransactionsPage = () => {
  return (
    <MainLayout title="All Transactions">
      <div className="space-y-6">
        <TransactionList pageTitle="All Transactions" filterParams={{}} />
      </div>
    </MainLayout>
  );
};

export default AdminTransactionsPage;
