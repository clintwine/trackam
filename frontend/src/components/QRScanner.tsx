/**
 * Camera-based QR code scanner.
 *
 * Wraps the `qr-scanner` package in a React component that:
 *  - Requests camera access on mount
 *  - Renders the live video feed in a square viewport with corner brackets
 *  - Calls onScan with the decoded text on the first successful read,
 *    then stops scanning until the parent unmounts the component
 *  - Surfaces a friendly error when the camera can't be opened
 *
 * Used by the join-leg modal so operators scan the driver's handover QR
 * from inside their dashboard instead of opening a shared URL.
 */

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { Loader2, AlertCircle, CameraOff } from "lucide-react";

interface Props {
  onScan: (text: string) => void;
  onError?: (message: string) => void;
}

export default function QRScanner({ onScan, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  // Keep latest callbacks without re-creating the scanner
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const [status, setStatus] = useState<"starting" | "running" | "error">("starting");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!videoRef.current) return;
    let stopped = false;

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        // Only fire once — parent decides whether to keep scanning
        if (stopped) return;
        stopped = true;
        scanner.stop();
        onScanRef.current(result.data);
      },
      {
        highlightScanRegion: false,
        highlightCodeOutline: false,
        preferredCamera: "environment",
      }
    );
    scannerRef.current = scanner;

    scanner.start()
      .then(() => { if (!stopped) setStatus("running"); })
      .catch((err: Error) => {
        const msg = err?.message?.includes("permission") || err?.message?.includes("denied")
          ? "Camera access was denied. Allow camera permission in your browser settings to scan."
          : err?.message?.includes("No camera") || err?.message?.includes("device")
            ? "No camera detected on this device."
            : "Couldn't open the camera. Try refreshing the page.";
        setErrorMsg(msg);
        setStatus("error");
        onErrorRef.current?.(msg);
      });

    return () => {
      stopped = true;
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
  }, []);

  return (
    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black border border-white/[0.08]">
      {/* Live video */}
      <video
        ref={videoRef}
        muted
        playsInline
        className={[
          "h-full w-full object-cover",
          status === "running" ? "opacity-100" : "opacity-0",
          "transition-opacity duration-300",
        ].join(" ")}
      />

      {/* Corner brackets — show only when running */}
      {status === "running" && (
        <>
          <span className="pointer-events-none absolute top-4 left-4  h-6 w-6 border-t-2 border-l-2 border-orange-400 rounded-tl-md" />
          <span className="pointer-events-none absolute top-4 right-4 h-6 w-6 border-t-2 border-r-2 border-orange-400 rounded-tr-md" />
          <span className="pointer-events-none absolute bottom-4 left-4  h-6 w-6 border-b-2 border-l-2 border-orange-400 rounded-bl-md" />
          <span className="pointer-events-none absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-orange-400 rounded-br-md" />
          <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-white/80 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md">
            Align the QR inside the box
          </span>
        </>
      )}

      {/* Starting state */}
      {status === "starting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-xs">Starting camera…</p>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="h-12 w-12 rounded-full bg-red-500/15 flex items-center justify-center">
            {errorMsg.includes("No camera") ? (
              <CameraOff className="h-6 w-6 text-red-400" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-400" />
            )}
          </div>
          <p className="text-xs text-red-300 leading-relaxed">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
