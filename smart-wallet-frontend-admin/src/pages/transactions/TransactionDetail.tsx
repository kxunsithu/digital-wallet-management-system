import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FileText, ArrowLeftRight, CreditCard, User, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RoleAwareLayout from "@/components/layouts/RoleAwareLayout";
import { getTransaction } from "@/services/transaction.service";
import TransferReceiptModal from "@/components/common/TransferReceiptModal";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receiptOpen, setReceiptOpen] = useState(false);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const res = await getTransaction(id);
        const data = res.data?.data ?? res.data;
        setTransaction(data);
      } catch {
        setError("Failed to load transaction details.");
      } finally {
        setLoading(false);
      }
    };
    void fetchTransaction();
  }, [id]);

  if (loading) {
    return (
      <RoleAwareLayout title="Transaction Detail">
        <div className="flex h-64 items-center justify-center">
          <p className="text-slate-500">Loading transaction...</p>
        </div>
      </RoleAwareLayout>
    );
  }

  if (error || !transaction) {
    return (
      <RoleAwareLayout title="Transaction Detail">
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <p className="text-red-500">{error || "Transaction not found."}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </div>
      </RoleAwareLayout>
    );
  }

  const formattedAmount = new Intl.NumberFormat("en-MM", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(transaction.amount || 0));

  const formattedFee = new Intl.NumberFormat("en-MM", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(transaction.fee || 0));

  const formattedType = (transaction.transaction_type || "").replace(/_/g, " ").toUpperCase();
  const formattedDate = transaction.created_at
    ? new Date(transaction.created_at).toLocaleString()
    : "";

  return (
    <RoleAwareLayout title="Transaction Detail">
      <div className="mb-6 space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate(-1)} className="cursor-pointer">
                Transactions
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Detail</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#BDF40B] text-[#10110E]">
              <ArrowLeftRight className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Transaction #{transaction.transaction_number || id}
              </h2>
              <p className="mt-1 font-mono text-sm text-muted-foreground">{formattedType}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${
                transaction.status === "completed"
                  ? "border-[#52C41A] text-[#52C41A]"
                  : transaction.status === "pending"
                    ? "border-[#BDF40B] bg-[#BDF40B] text-[#10110E]"
                    : "border-[#FF4D4F] text-[#FF4D4F]"
              }`}
            >
              {transaction.status || "pending"}
            </span>
            <Button
              onClick={() => setReceiptOpen(true)}
              className="h-10 rounded-lg bg-[#BDF40B] font-semibold text-[#10110E] hover:bg-[#BDF40B]"
            >
              <FileText className="mr-2 h-4 w-4" />
              Receipt
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Summary Card */}
        <Card className="overflow-hidden rounded-2xl border border-border shadow-none">
          <CardHeader className="border-b border-border py-5">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <CreditCard className="h-5 w-5 text-[#10110E]" />
              Transfer Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-col items-center justify-center rounded-xl border border-[#BDF40B] bg-[#BDF40B] p-6 text-center text-[#10110E]">
              <span className="mb-2 text-xs font-semibold tracking-wider uppercase opacity-80">
                Amount Transferred
              </span>
              <span className="text-3xl font-extrabold">
                {formattedAmount} <span className="text-base font-semibold">MMK</span>
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between rounded-xl border border-border bg-white p-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Transaction No.
                </span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {transaction.transaction_number || "-"}
                </span>
              </div>
              <div className="flex justify-between rounded-xl border border-border bg-white p-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Type
                </span>
                <span className="text-sm font-semibold text-foreground">{formattedType}</span>
              </div>
              <div className="flex justify-between rounded-xl border border-border bg-white p-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Fee
                </span>
                <span className="text-sm font-semibold text-foreground">{formattedFee} MMK</span>
              </div>
              <div className="flex justify-between rounded-xl border border-border bg-white p-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date &amp; Time
                </span>
                <span className="text-sm font-semibold text-foreground">{formattedDate}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sender & Receiver Card */}
        <Card className="overflow-hidden rounded-2xl border border-border shadow-none">
          <CardHeader className="border-b border-border py-5">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <User className="h-5 w-5 text-[#10110E]" />
              Parties Involved
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {/* Sender */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sender
              </p>
              <div className="rounded-xl border border-border bg-white p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Name</span>
                    <span className="font-semibold text-slate-800">
                      {transaction.sender_name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Phone</span>
                    <span className="font-semibold text-slate-800">
                      {transaction.sender_phone || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Wallet ID</span>
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      {transaction.sender_wallet_id || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Receiver */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Receiver
              </p>
              <div className="rounded-xl border border-border bg-white p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Name</span>
                    <span className="font-semibold text-slate-800">
                      {transaction.receiver_name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Phone</span>
                    <span className="font-semibold text-slate-800">
                      {transaction.receiver_phone || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Wallet ID</span>
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      {transaction.receiver_wallet_id || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {transaction.description && (
        <Card className="mt-6 overflow-hidden rounded-2xl border border-border shadow-none">
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Activity className="h-4 w-4 text-[#10110E]" />
              Description
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <p className="text-sm text-slate-700">{transaction.description}</p>
          </CardContent>
        </Card>
      )}

      <TransferReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        transaction={transaction}
      />
    </RoleAwareLayout>
  );
}
