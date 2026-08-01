import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Percent,
  ShieldCheck,
  SlidersHorizontal,
  Save,
  Loader2,
  ArrowLeftRight,
  Lock,
} from "lucide-react";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTransferSettings, updateTransferSettings } from "@/services/settings.service";

type SettingsForm = {
  unverified_customer_transfer_limit: string;
  customer_transfer_fee_percent: string;
  merchant_payment_fee_percent: string;
};

const FeeSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SettingsForm>({
    unverified_customer_transfer_limit: "",
    customer_transfer_fee_percent: "",
    merchant_payment_fee_percent: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTransferSettings();
      const data = res.data?.data ?? {};
      setForm({
        unverified_customer_transfer_limit:
          data.unverified_customer_transfer_limit !== null &&
          data.unverified_customer_transfer_limit !== undefined
            ? String(data.unverified_customer_transfer_limit)
            : "",
        customer_transfer_fee_percent:
          data.customer_transfer_fee_percent ?? "",
        merchant_payment_fee_percent:
          data.merchant_payment_fee_percent ?? "",
      });
    } catch {
      toast.error("Unable to load transfer settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const feePercent = Number(form.customer_transfer_fee_percent);
    const merchantFeePercent = Number(form.merchant_payment_fee_percent);
    if (Number.isNaN(feePercent) || Number.isNaN(merchantFeePercent)) {
      toast.error("Please enter valid fee percentages.");
      return;
    }

    const limitRaw = form.unverified_customer_transfer_limit.trim();
    const limit = limitRaw === "" ? null : Number(limitRaw);
    if (limitRaw !== "" && (Number.isNaN(limit as number) || (limit as number) < 0)) {
      toast.error("Please enter a valid transfer limit.");
      return;
    }

    try {
      setSaving(true);
      await updateTransferSettings({
        unverified_customer_transfer_limit: limit,
        customer_transfer_fee_percent: feePercent,
        merchant_payment_fee_percent: merchantFeePercent,
      });
      toast.success("Transfer settings updated.");
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Fee & Limit Settings">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border bg-[#BCF807] px-6 py-3 text-xs font-bold tracking-[0.2em] text-[#10110E] uppercase md:px-8">
            Platform configuration
          </div>
          <div className="p-6 md:p-8">
            <div className="mb-8 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#BCF807] text-[#10110E]">
                <SlidersHorizontal className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Money Transfer Rules
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure per-transaction limits for unverified customers and
                  the percentage fees charged on customer transfers and
                  merchant payments. All fees are credited to the admin (system)
                  wallet.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-3 py-12">
                <Loader2 className="h-5 w-5 animate-spin text-[#10110E]" />
                <p className="text-sm text-muted-foreground">
                  Loading settings…
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="rounded-2xl border border-border shadow-none">
                  <CardHeader className="border-b border-border px-6 py-5">
                    <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#BCF807] text-[#10110E]">
                        <Lock className="h-4 w-4" />
                      </div>
                      Unverified Customer Limit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="unverifiedLimit"
                        className="text-sm font-medium text-slate-700"
                      >
                        Max transfer amount (per transaction)
                      </Label>
                      <div className="relative">
                        <Input
                          id="unverifiedLimit"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="100,000"
                          value={form.unverified_customer_transfer_limit}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              unverified_customer_transfer_limit: e.target.value,
                            }))
                          }
                          className="h-11 pl-9"
                        />
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                          Ks
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Leave empty to allow unverified customers to transfer
                        without limit. NRC-verified customers are always
                        unlimited.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="rounded-2xl border border-border shadow-none">
                    <CardHeader className="border-b border-border px-6 py-5">
                      <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#BCF807] text-[#10110E]">
                          <ArrowLeftRight className="h-4 w-4" />
                        </div>
                        Customer Transfer Fee
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="customerFee"
                          className="text-sm font-medium text-slate-700"
                        >
                          Fee (% of transfer amount)
                        </Label>
                        <div className="relative">
                          <Input
                            id="customerFee"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="0.5"
                            value={form.customer_transfer_fee_percent}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                customer_transfer_fee_percent: e.target.value,
                              }))
                            }
                            className="h-11 pr-9"
                          />
                          <Percent className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-slate-500">
                          Charged on every customer → customer / customer →
                          agent transfer.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-border shadow-none">
                    <CardHeader className="border-b border-border px-6 py-5">
                      <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#BCF807] text-[#10110E]">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        Merchant Payment Fee
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="merchantFee"
                          className="text-sm font-medium text-slate-700"
                        >
                          Fee (% of payment amount)
                        </Label>
                        <div className="relative">
                          <Input
                            id="merchantFee"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="1.0"
                            value={form.merchant_payment_fee_percent}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                merchant_payment_fee_percent: e.target.value,
                              }))
                            }
                            className="h-11 pr-9"
                          />
                          <Percent className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-slate-500">
                          Charged on third-party wallet payments
                          (phone + OTP + PIN flow).
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="h-12 gap-2 rounded-xl bg-[#BCF807] px-8 text-sm font-semibold tracking-wide text-[#10110E] shadow-none hover:bg-[#BCF807]/90 disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FeeSettingsPage;
