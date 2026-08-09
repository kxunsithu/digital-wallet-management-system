import { useEffect, useRef, useState } from "react";
import { BarcodeDetector } from "barcode-detector/ponyfill";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type QrScannerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (value: string) => void;
  title?: string;
  description?: string;
};

const START_TIMEOUT_MS = 15000;
const SCAN_INTERVAL_MS = 150;

function stopStream(stream: MediaStream | null) {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

/**
 * Self-contained camera QR scanner.
 *
 * Unlike the naive `video.play()` + fixed-timeout approach used by some
 * libraries, this waits for the video element to actually load its stream
 * (`loadedmetadata`) before calling `play()`, uses a generous timeout, falls
 * back across available camera-facing modes, and always releases the camera
 * on unmount so a failed start can never lock the camera for later attempts.
 */
function CameraScanner({
  onScan,
  onError,
  onStartingChange,
}: {
  onScan: (value: string) => void;
  onError: (message: string) => void;
  onStartingChange?: (starting: boolean) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelledRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  const onStartingChangeRef = useRef(onStartingChange);

  useEffect(() => {
    onScanRef.current = onScan;
    onErrorRef.current = onError;
    onStartingChangeRef.current = onStartingChange;
  });

  useEffect(() => {
    const video = videoRef.current;
    let intervalId: number | undefined;
    let detector: BarcodeDetector | undefined;
    let scanning = false;

    const scanFrame = async () => {
      if (!video || !detector || cancelledRef.current || scanning) return;
      if (video.readyState < 2 || video.videoWidth === 0) return;

      scanning = true;
      try {
        const codes = await detector.detect(video);
        const value = codes[0]?.rawValue?.trim();
        if (!value) return;

        if (intervalId !== undefined) clearInterval(intervalId);
        stopStream(streamRef.current);
        onScanRef.current(value);
      } catch {
        // Detection can transiently fail (e.g. frame not fully decoded yet);
        // keep scanning.
      } finally {
        scanning = false;
      }
    };

    const acquireStream = async (): Promise<MediaStream> => {
      const videoModes: Array<MediaTrackConstraints | boolean> = [
        { facingMode: "environment" },
        { facingMode: "user" },
        true,
      ];
      let lastError: unknown;
      for (const mode of videoModes) {
        if (cancelledRef.current) break;
        try {
          return await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: mode,
          });
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError ?? new Error("Unable to access any camera.");
    };

    const start = async () => {
      if (!video) return;

      try {
        if (!window.isSecureContext) {
          throw new Error(
            "Camera access requires a secure (HTTPS) connection."
          );
        }
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("This browser does not support camera access.");
        }

        detector = new BarcodeDetector({ formats: ["qr_code"] });

        const stream = await acquireStream();
        if (cancelledRef.current) {
          stopStream(stream);
          return;
        }
        streamRef.current = stream;
        video.srcObject = stream;

        await new Promise<void>((resolve, reject) => {
          const timeout = window.setTimeout(
            () =>
              reject(
                new Error(
                  "Camera stream timed out while starting. Please retry."
                )
              ),
            START_TIMEOUT_MS
          );
          const onLoaded = () => {
            window.clearTimeout(timeout);
            video.removeEventListener("loadedmetadata", onLoaded);
            resolve();
          };
          video.addEventListener("loadedmetadata", onLoaded);
        });

        if (cancelledRef.current) return;
        await video.play();

        if (!cancelledRef.current) {
          onStartingChangeRef.current?.(false);
        }
        intervalId = window.setInterval(scanFrame, SCAN_INTERVAL_MS);
      } catch (error) {
        if (!cancelledRef.current) {
          onErrorRef.current(
            error instanceof Error
              ? error.message
              : "Unable to access the camera."
          );
        }
      }
    };

    void start();

    return () => {
      cancelledRef.current = true;
      if (intervalId !== undefined) clearInterval(intervalId);
      if (video) {
        video.srcObject = null;
        video.removeAttribute("src");
      }
      stopStream(streamRef.current);
    };
  }, []);

  return (
    <div className="relative flex min-h-[280px] w-full items-center justify-center bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="h-full max-h-[320px] w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-48 w-48">
          <span className="absolute top-0 left-0 h-8 w-8 rounded-tl-lg border-t-4 border-l-4 border-white/90" />
          <span className="absolute top-0 right-0 h-8 w-8 rounded-tr-lg border-t-4 border-r-4 border-white/90" />
          <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-white/90" />
          <span className="absolute right-0 bottom-0 h-8 w-8 rounded-br-lg border-r-4 border-b-4 border-white/90" />
        </div>
      </div>
    </div>
  );
}

export default function QrScannerDialog({
  open,
  onOpenChange,
  onScan,
  title = "Scan QR Code",
  description = "Point your camera at an agent manager QR code.",
}: QrScannerDialogProps) {
  const [cameraError, setCameraError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [starting, setStarting] = useState(true);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCameraError("");
      setStarting(true);
    }
    onOpenChange(nextOpen);
  };

  const handleScan = (rawValue: string) => {
    if (!rawValue) return;
    onScan(rawValue);
    handleOpenChange(false);
  };

  const handleRetry = () => {
    setCameraError("");
    setStarting(true);
    setAttempt((current) => current + 1);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-black">
          {open ? (
            <CameraScanner
              key={attempt}
              onScan={handleScan}
              onError={(message) => {
                setStarting(false);
                setCameraError(message);
              }}
              onStartingChange={setStarting}
            />
          ) : null}
        </div>

        {starting && !cameraError ? (
          <p className="text-xs text-slate-500">
            Starting camera… Allow camera access when prompted.
          </p>
        ) : null}

        {cameraError ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-red-500">{cameraError}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetry}
            >
              Retry
            </Button>
          </div>
        ) : null}

        {!starting && !cameraError ? (
          <p className="text-xs text-slate-500">
            Scanning stops automatically after a valid QR is detected.
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
