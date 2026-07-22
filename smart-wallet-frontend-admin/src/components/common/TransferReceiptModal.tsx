import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Printer, X, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type TransferReceiptModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: any;
  autoDownload?: boolean;
};

export default function TransferReceiptModal({
  open,
  onOpenChange,
  transaction,
  autoDownload = false,
}: TransferReceiptModalProps) {
  const [lastSavedId, setLastSavedId] = useState<string | number | null>(null);

  const formattedAmount = transaction
    ? new Intl.NumberFormat("en-MM", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(Number(transaction.amount || 0))
    : "0";

  const formattedFee = transaction
    ? new Intl.NumberFormat("en-MM", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(Number(transaction.fee || 0))
    : "0";

  const formattedType = transaction
    ? (transaction.transaction_type || "").replace(/_/g, " ").toUpperCase()
    : "";

  const formattedDate = transaction
    ? transaction.created_at
      ? new Date(transaction.created_at).toLocaleString()
      : new Date().toLocaleString()
    : "";

  const handleCopyRef = async () => {
    if (!transaction) return;
    try {
      await navigator.clipboard.writeText(transaction.transaction_number);
      toast.success("Transaction number copied");
    } catch {
      toast.error("Failed to copy transaction number");
    }
  };

  const handleDownload = () => {
    if (!transaction) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 680;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fill background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 400, 680);

      // Draw border
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 380, 660);

      // Header Area Background
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(11, 11, 378, 80);

      // Draw Check Circle
      ctx.beginPath();
      ctx.arc(200, 50, 20, 0, 2 * Math.PI);
      ctx.fillStyle = "#10b981";
      ctx.fill();

      // Checkmark inside circle
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(192, 50);
      ctx.lineTo(197, 55);
      ctx.lineTo(208, 44);
      ctx.stroke();

      // Title
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Transfer Successful", 200, 115);

      // Amount Label
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("AMOUNT TRANSFERRED", 200, 150);

      // Amount Value
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 26px sans-serif";
      ctx.fillText(`${formattedAmount} MMK`, 200, 185);

      const drawRoundedRect = (
        c: CanvasRenderingContext2D,
        rx: number,
        ry: number,
        rw: number,
        rh: number,
        radius: number
      ) => {
        c.beginPath();
        c.moveTo(rx + radius, ry);
        c.lineTo(rx + rw - radius, ry);
        c.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
        c.lineTo(rx + rw, ry + rh - radius);
        c.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
        c.lineTo(rx + radius, ry + rh);
        c.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
        c.lineTo(rx, ry + radius);
        c.quadraticCurveTo(rx, ry, rx + radius, ry);
        c.closePath();
      };

      // Status Badge Background
      ctx.fillStyle = "#ecfdf5";
      drawRoundedRect(ctx, 160, 202, 80, 22, 11);
      ctx.fill();

      ctx.fillStyle = "#047857";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("Completed", 200, 217);

      // Dotted line separator
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, 245);
      ctx.lineTo(370, 245);
      ctx.stroke();
      ctx.setLineDash([]); // Reset

      // Draw details list
      let y = 280;
      const drawRow = (label: string, value: any, isMono = false) => {
        const valStr = String(value ?? "—");
        ctx.fillStyle = "#64748b";
        ctx.font = "13px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(label, 30, y);

        ctx.fillStyle = "#334155";
        ctx.font = isMono ? "bold 12px monospace" : "bold 13px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(valStr, 370, y);
        y += 32;
      };

      drawRow("Transaction No.", transaction.transaction_number, true);
      drawRow("Transfer Type", formattedType);
      drawRow("Date & Time", formattedDate);

      // Dotted divider
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.moveTo(30, y - 10);
      ctx.lineTo(370, y - 10);
      ctx.stroke();
      ctx.setLineDash([]);
      y += 15;

      // Sender
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("SENDER DETAILS", 30, y);
      y += 24;
      drawRow("Name", transaction.sender_name);
      drawRow("Phone", transaction.sender_phone);

      // Dotted divider
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.moveTo(30, y - 10);
      ctx.lineTo(370, y - 10);
      ctx.stroke();
      ctx.setLineDash([]);
      y += 15;

      // Receiver
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("RECEIVER DETAILS", 30, y);
      y += 24;
      drawRow("Name", transaction.receiver_name);
      drawRow("Phone", transaction.receiver_phone);

      // Dotted divider
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.moveTo(30, y - 10);
      ctx.lineTo(370, y - 10);
      ctx.stroke();
      ctx.setLineDash([]);
      y += 15;

      // Fee & Description
      drawRow("Transfer Fee", `${formattedFee} MMK`);
      drawRow("Description", transaction.description);

      // Trigger download
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Receipt-${transaction.transaction_number || "Transaction"}.png`;
      link.href = dataUrl;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Receipt downloaded successfully");
    } catch (err) {
      console.error("Receipt generation/download failed:", err);
      toast.error("Failed to generate downloadable receipt image");
    }
  };

  const handlePrint = () => {
    if (!transaction) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Failed to open print window");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${transaction.transaction_number}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              padding: 40px;
              color: #1e293b;
              background: #f8fafc;
              display: flex;
              justify-content: center;
            }
            .receipt {
              width: 100%;
              max-width: 420px;
              background: #ffffff;
              border: 1px solid #e2e8f0;
              padding: 32px;
              border-radius: 16px;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
            }
            .header {
              text-align: center;
              margin-bottom: 24px;
            }
            .header h3 {
              margin: 0;
              font-size: 20px;
              font-weight: 700;
              color: #0f172a;
            }
            .header p {
              margin: 4px 0 0 0;
              font-size: 13px;
              color: #64748b;
            }
            .amount-section {
              text-align: center;
              margin-bottom: 24px;
              padding: 16px;
              background: #f8fafc;
              border-radius: 12px;
              border: 1px solid #f1f5f9;
            }
            .amount-label {
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #64748b;
              margin-bottom: 4px;
            }
            .amount {
              font-size: 32px;
              font-weight: 800;
              color: #0f172a;
            }
            .status {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              margin-top: 8px;
              font-size: 13px;
              font-weight: 600;
              color: #10b981;
            }
            .divider {
              border-top: 1px dashed #cbd5e1;
              margin: 20px 0;
            }
            .section-title {
              font-size: 11px;
              font-weight: 700;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 12px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 14px;
              line-height: 1.5;
            }
            .label {
              color: #64748b;
            }
            .value {
              font-weight: 600;
              color: #334155;
              text-align: right;
            }
            .ref-value {
              font-family: monospace;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h3>Transaction Receipt</h3>
              <p>Smart Wallet System</p>
            </div>
            
            <div class="amount-section">
              <div class="amount-label">Amount Transferred</div>
              <div class="amount">${formattedAmount} <span style="font-size: 18px; font-weight: 600;">MMK</span></div>
              <div class="status">● Completed</div>
            </div>
            
            <div class="row">
              <span class="label">Transaction Number:</span>
              <span class="value ref-value">${transaction.transaction_number}</span>
            </div>
            <div class="row">
              <span class="label">Type:</span>
              <span class="value">${formattedType}</span>
            </div>
            <div class="row">
              <span class="label">Date & Time:</span>
              <span class="value">${formattedDate}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="section-title">Sender Info</div>
            <div class="row">
              <span class="label">Name:</span>
              <span class="value">${transaction.sender_name || "—"}</span>
            </div>
            <div class="row">
              <span class="label">Phone:</span>
              <span class="value">${transaction.sender_phone || "—"}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="section-title">Receiver Info</div>
            <div class="row">
              <span class="label">Name:</span>
              <span class="value">${transaction.receiver_name || "—"}</span>
            </div>
            <div class="row">
              <span class="label">Phone:</span>
              <span class="value">${transaction.receiver_phone || "—"}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="row">
              <span class="label">Transfer Fee:</span>
              <span class="value">${formattedFee} MMK</span>
            </div>
            <div class="row">
              <span class="label">Description:</span>
              <span class="value">${transaction.description || "—"}</span>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Auto-save download trigger when modal opens with new transaction
  useEffect(() => {
    const receiptId = transaction?.id ?? transaction?.transaction_number ?? transaction?.created_at;

    if (autoDownload && open && receiptId && receiptId !== lastSavedId) {
      setLastSavedId(receiptId);
      const timer = setTimeout(() => {
        handleDownload();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, open, transaction, lastSavedId]);

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-xl" showCloseButton={false}>
        {/* Header container */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <DialogTitle className="text-base font-bold text-white">Transfer Successful</DialogTitle>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6">
          {/* Amount Badge */}
          <div className="text-center py-5 bg-slate-50 border border-slate-100 rounded-2xl">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Amount Transferred
            </span>
            <span className="text-3xl font-extrabold text-slate-900 block">
              {formattedAmount} <span className="text-sm font-semibold text-slate-500">MMK</span>
            </span>
            <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              Completed
            </span>
          </div>

          {/* Details list */}
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">Transaction No.</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-800 text-xs">
                  {transaction.transaction_number}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Transfer Type</span>
              <span className="font-semibold text-slate-800 text-xs">{formattedType}</span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Date & Time</span>
              <span className="font-semibold text-slate-800 text-xs">{formattedDate}</span>
            </div>

            <div className="border-t border-dashed border-slate-200 my-4" />

            {/* Sender */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Sender Details
              </span>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Name</span>
                <span className="font-semibold text-slate-800">{transaction.sender_name || "—"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Phone</span>
                <span className="font-semibold text-slate-800">{transaction.sender_phone || "—"}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200 my-4" />

            {/* Receiver */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Receiver Details
              </span>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Name</span>
                <span className="font-semibold text-slate-800">{transaction.receiver_name || "—"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Phone</span>
                <span className="font-semibold text-slate-800">{transaction.receiver_phone || "—"}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200 my-4" />

            {/* Fee & Desc */}
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Transfer Fee</span>
              <span className="font-semibold text-slate-800">{formattedFee} MMK</span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Description</span>
              <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">
                {transaction.description || "—"}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="button"
              onClick={handleDownload}
              variant="outline"
              className="w-full h-11 border-slate-200 text-slate-700 rounded-xl font-semibold tracking-wide flex items-center justify-center gap-2 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Download PNG
            </Button>
            <Button
              type="button"
              onClick={handlePrint}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold tracking-wide flex items-center justify-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full h-11 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
