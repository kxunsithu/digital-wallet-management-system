import { useEffect, useState } from "react";
import { CircleDollarSign, Coins, ReceiptText, Loader2 } from "lucide-react";
import MainLayout from "@/components/layouts/MainLayout";
import TransactionList from "./TransactionList";
import { Card, CardContent } from "@/components/ui/card";
import { getFeeSummary } from "@/services/transaction.service";

type FeeSummary = {
  total_fee_income?: number;
  total_fee_transactions?: number;
  by_type?: Array<{ transaction_type: string; count: number; total: string | number }>;
};

const formatAmount = (value: number | string | undefined) =>
  new Intl.NumberFormat("en-MM", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));

const FeeIncomePage = () => {
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getFeeSummary();
        setSummary(res.data?.data ?? null);
      } catch {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <MainLayout title="Fee Income">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="rounded-2xl border border-border bg-white shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Fee Income
                  </p>
                  <h3 className="mt-1 text-3xl font-bold text-foreground">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    ) : (
                      formatAmount(summary?.total_fee_income)
                    )}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">MMK</p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#BCF807]/10 text-[#10110E]">
                  <CircleDollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-white shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Fee Transactions
                  </p>
                  <h3 className="mt-1 text-3xl font-bold text-foreground">
                    {loading ? "—" : (summary?.total_fee_transactions ?? 0)}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    transfers that carried a fee
                  </p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#BCF807]/10 text-[#10110E]">
                  <ReceiptText className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-white shadow-none lg:col-span-1">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Income by Type
              </p>
              <div className="mt-3 space-y-2">
                {(summary?.by_type ?? []).length === 0 && !loading ? (
                  <p className="text-sm text-slate-500">No fee income yet.</p>
                ) : (
                  (summary?.by_type ?? []).map((row) => (
                    <div
                      key={row.transaction_type}
                      className="flex items-center justify-between rounded-lg border border-border bg-slate-50/50 px-3 py-2"
                    >
                      <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <Coins className="h-3.5 w-3.5 text-slate-400" />
                        {row.transaction_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {formatAmount(row.total)}
                        <span className="ml-1 font-normal text-slate-400">
                          ({row.count})
                        </span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <TransactionList
          pageTitle="Fee Income"
          filterParams={{ fee_income: true }}
        />
      </div>
    </MainLayout>
  );
};

export default FeeIncomePage;
