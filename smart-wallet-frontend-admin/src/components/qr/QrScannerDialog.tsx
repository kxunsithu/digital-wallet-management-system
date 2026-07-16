import { useEffect, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type QrScannerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (value: string) => void;
  title?: string;
  description?: string;
};

export default function QrScannerDialog({
  open,
  onOpenChange,
  onScan,
  title = "Scan QR Code",
  description = "Point your camera at an agent manager QR code.",
}: QrScannerDialogProps) {
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    if (!open) {
      setCameraError("");
    }
  }, [open]);

  const handleScan = (detectedCodes: Array<{ rawValue?: string }>) => {
    const rawValue = detectedCodes[0]?.rawValue?.trim();
    if (!rawValue) {
      return;
    }

    onScan(rawValue);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-black">
          {open ? (
            <Scanner
              onScan={handleScan}
              onError={(error) => setCameraError(error.message || "Unable to access camera.")}
              paused={!open}
              constraints={{ facingMode: "environment" }}
              formats={["qr_code"]}
              components={{
                finder: true,
                torch: true,
                zoom: true,
              }}
              styles={{
                container: { width: "100%", minHeight: "280px" },
                video: { width: "100%", objectFit: "cover" },
              }}
            />
          ) : null}
        </div>

        {cameraError ? (
          <p className="text-sm text-red-500">{cameraError}</p>
        ) : (
          <p className="text-xs text-slate-500">
            Allow camera access when prompted. Scanning stops automatically after a valid QR is detected.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
