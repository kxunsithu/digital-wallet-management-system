import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTransactions } from "@/services/transaction.service";
import { useNavigate } from "react-router-dom";

type Props = {
  filterParams?: Record<string, any>;
  pageTitle?: string;
};

export default function TransactionList({ filterParams = {}, pageTitle = "Transactions" }: Props) {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [fromEntry, setFromEntry] = useState(0);
  const [toEntry, setToEntry] = useState(0);

  const load = async (pageNumber = page, pageSize = perPage) => {
    try {
      setLoading(true);
      const params = { ...filterParams, page: pageNumber, per_page: pageSize } as Record<string, any>;
      if (query) params.search = query;
      const res = await getTransactions(params);
      const payload = res.data?.data ?? res.data ?? {};
      const data = payload?.data ?? payload ?? [];
      setItems(Array.isArray(data) ? data : []);
      setTotalEntries(payload?.meta?.total ?? 0);
      setTotalPages(payload?.meta?.last_page ?? 1);
      setFromEntry(payload?.meta?.from ?? 0);
      setToEntry(payload?.meta?.to ?? 0);
    } catch (e) {
      setItems([]);
      setTotalEntries(0);
      setTotalPages(1);
      setFromEntry(0);
      setToEntry(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    void load(1, perPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filterParams)]);

  useEffect(() => {
    void load(page, perPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">{pageTitle}</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input placeholder="Search by transaction no or phone" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Button
            onClick={() => {
              setPage(1);
              void load(1, perPage);
            }}
            disabled={loading}
          >
            {loading ? "Loading..." : "Search"}
          </Button>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full table-auto divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">Transaction No</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-right">Fee</th>
              <th className="px-3 py-2 text-left">Sender</th>
              <th className="px-3 py-2 text-left">Receiver</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-sm text-slate-500">
                  {loading ? "Loading transactions..." : "No transactions found."}
                </td>
              </tr>
            ) : (
              items.map((tx: any) => (
                <tr key={tx.id}>
                  <td className="px-3 py-2">{tx.transaction_number}</td>
                  <td className="px-3 py-2">{tx.transaction_type}</td>
                  <td className="px-3 py-2 text-right">{tx.amount}</td>
                  <td className="px-3 py-2 text-right">{tx.fee}</td>
                  <td className="px-3 py-2">{tx.sender_phone ?? tx.sender_wallet_id}</td>
                  <td className="px-3 py-2">{tx.receiver_phone ?? tx.receiver_wallet_id}</td>
                  <td className="px-3 py-2">{tx.status}</td>
                  <td className="px-3 py-2">{new Date(tx.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/transactions/${tx.id}`)}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100 py-3.5 px-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/40 text-slate-500 text-xs">
        <div>
          Showing {fromEntry} to {toEntry} of {totalEntries} entries
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <Select
              value={perPage.toString()}
              onValueChange={(val) => {
                const size = Number(val);
                setPerPage(size);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue placeholder={perPage.toString()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              {"<<"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              {"<"}
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
            >
              {">"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              {">>"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
