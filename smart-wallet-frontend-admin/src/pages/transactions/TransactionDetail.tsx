import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Download, CheckCircle2, Copy, Printer, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RoleAwareLayout from "@/components/layouts/RoleAwareLayout";
import { getTransaction } from "@/services/transaction.service";
import { toast } from "sonner";
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
      } catch (err: any) {
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
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="ml-auto flex items-center gap-2">
            <Button onClick={() => setReceiptOpen(true)} className="gap-2">
              <FileText className="h-4 w-4" />
              View / Download Receipt
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Transfer Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-6 text-center ring-1 ring-slate-100">
                <span className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Amount Transferred
                </span>
                <span className="text-4xl font-extrabold text-slate-900">
                  {formattedAmount} <span className="text-lg text-slate-500">MMK</span>
                </span>
                <Badge
                  variant="outline"
                  className="mt-4 bg-emerald-50 text-emerald-700 border-emerald-200"
                >
                  {transaction.status}
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Transaction No.</span>
                  <span className="font-mono font-medium text-slate-900">
                    {transaction.transaction_number}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Type</span>
                  <span className="font-medium text-slate-900">{formattedType}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Fee</span>
                  <span className="font-medium text-slate-900">{formattedFee} MMK</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-slate-500">Date & Time</span>
                  <span className="font-medium text-slate-900">{formattedDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sender & Receiver Card */}
          <Card>
            <CardHeader>
              <CardTitle>Parties Involved</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Sender */}
              <div>
                <h3 className="mb-4 text-xs font-bold tracking-widest text-slate-400 uppercase">
                  Sender
                </h3>
                <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name</span>
                      <span className="font-medium text-slate-900">
                        {transaction.sender_name || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone</span>
                      <span className="font-medium text-slate-900">
                        {transaction.sender_phone || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Wallet ID</span>
                      <span className="font-mono text-slate-900">
                        {transaction.sender_wallet_id || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Receiver */}
              <div>
                <h3 className="mb-4 text-xs font-bold tracking-widest text-slate-400 uppercase">
                  Receiver
                </h3>
                <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name</span>
                      <span className="font-medium text-slate-900">
                        {transaction.receiver_name || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone</span>
                      <span className="font-medium text-slate-900">
                        {transaction.receiver_phone || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Wallet ID</span>
                      <span className="font-mono text-slate-900">
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
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{transaction.description}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <TransferReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        transaction={transaction}
      />
    </RoleAwareLayout>
  );
}
