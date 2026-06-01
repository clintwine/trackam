import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X, ExternalLink, Copy, CheckCircle2, GitCommit } from "lucide-react";
import { systemApi, type VersionInfo } from "@/services/system";

const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

interface Props {
  collapsed: boolean;
}

export default function UpdateAvailable({ collapsed }: Props) {
  const [info, setInfo] = useState<VersionInfo | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    function poll() {
      systemApi.version()
        .then((v) => { if (active) setInfo(v); })
        .catch(() => { /* silent — non-critical */ });
    }
    poll();
    timer = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  if (!info?.updateAvailable) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Update available"
        className={[
          "group inline-flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/[0.1] text-orange-300",
          "hover:bg-orange-500/[0.16] hover:border-orange-500/40 transition-colors",
          "h-9 font-medium text-xs",
          collapsed ? "w-9 justify-center" : "px-3 w-full",
        ].join(" ")}
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        {!collapsed && (
          <span className="whitespace-nowrap">Update available</span>
        )}
      </button>

      {open && (
        <UpdateModal info={info} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function UpdateModal({ info, onClose }: { info: VersionInfo; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const command = "trackam update";

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Update available"
        className="relative w-full max-w-md rounded-xl bg-[#0c1522] shadow-2xl shadow-black/50 border border-white/[0.08] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Update available</p>
              <p className="text-[11px] text-stone-500">A newer version of Trackam is on {info.branch}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-600 hover:text-stone-300 transition-colors" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Version comparison */}
          <div className="grid grid-cols-2 gap-3">
            <VersionTile label="You're on" sha={info.current} dim />
            <VersionTile label="Latest" sha={info.latest} highlight />
          </div>

          {/* Latest commit summary */}
          {info.latestMessage && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wide mb-1">Latest change</p>
              <p className="text-xs text-stone-200 leading-relaxed">{info.latestMessage}</p>
              {(info.latestAuthor || info.latestDate) && (
                <p className="text-[11px] text-stone-600 mt-1.5">
                  {info.latestAuthor || "Unknown"}
                  {info.latestDate && (
                    <> · <RelativeTime iso={info.latestDate} /></>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Instructions */}
          <div>
            <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">How to update</p>
            <p className="text-xs text-stone-400 mb-2.5 leading-relaxed">
              Run the command below in your terminal on the host running Trackam. Once it finishes,
              stop and restart your Trackam services.
            </p>

            <div className="flex items-center gap-2 rounded-lg bg-[#060d18] border border-white/[0.08] pl-3.5 pr-2 py-2">
              <code className="flex-1 font-mono text-xs text-orange-300 whitespace-nowrap overflow-x-auto">
                <span className="text-stone-600 select-none">$ </span>{command}
              </code>
              <button
                type="button"
                onClick={copyCommand}
                className="shrink-0 inline-flex items-center gap-1 rounded-md px-2 h-7 text-[11px] font-medium text-stone-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                {copied
                  ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Copied</>
                  : <><Copy className="h-3 w-3" /> Copy</>}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {info.compareUrl && (
              <a
                href={info.compareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] h-10 text-xs font-medium text-stone-300 hover:text-white transition-all"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View changes on GitHub
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-orange-500 to-orange-600 h-10 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 hover:shadow-orange-500/30 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function VersionTile({ label, sha, dim, highlight }: {
  label: string;
  sha: string | null;
  dim?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={[
      "rounded-lg border px-3.5 py-3",
      highlight ? "border-orange-500/25 bg-orange-500/[0.06]" : "border-white/[0.06] bg-white/[0.02]",
    ].join(" ")}>
      <p className={["text-[11px] font-medium uppercase tracking-wide mb-1", highlight ? "text-orange-400/80" : "text-stone-500"].join(" ")}>{label}</p>
      <p className={[
        "font-mono text-sm font-semibold inline-flex items-center gap-1.5",
        highlight ? "text-orange-200" : dim ? "text-stone-400" : "text-white",
      ].join(" ")}>
        <GitCommit className={["h-3.5 w-3.5", highlight ? "text-orange-400" : "text-stone-500"].join(" ")} />
        {sha || "unknown"}
      </p>
    </div>
  );
}

function RelativeTime({ iso }: { iso: string }) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);

  let label = "";
  if (minutes < 1)         label = "just now";
  else if (minutes < 60)   label = `${minutes}m ago`;
  else if (minutes < 1440) label = `${Math.round(minutes / 60)}h ago`;
  else                     label = `${Math.round(minutes / 1440)}d ago`;

  return <span title={date.toLocaleString()}>{label}</span>;
}

