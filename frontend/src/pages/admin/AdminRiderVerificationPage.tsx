import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck, ShieldAlert, Loader2, X, Phone as PhoneIcon, Mail,
  ZoomIn, Inbox,
} from "lucide-react";
import { ridersApi, type Rider, type GovtIdType } from "@/services/logistics";

const ID_TYPE_LABELS: Record<GovtIdType, string> = {
  nin: "NIN",
  voters_card: "Voter's Card",
  passport: "International Passport",
  drivers_license: "Driver's License",
};

export default function AdminRiderVerificationPage() {
  const [pending, setPending] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Rider | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ridersApi.pendingVerification();
      setPending(data);
    } catch {
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function onDecision(updated: Rider) {
    // Remove the rider from the queue. Closing the modal triggers the visual
    // refresh; the next render won't include them since the queue endpoint
    // only returns pending rows.
    setPending((prev) => prev.filter((r) => r.id !== updated.id));
    setSelected(null);
  }

  if (loading) {
    return (
      <div className="max-w-4xl space-y-3 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-white/[0.03] border border-white/[0.06]" />
        ))}
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="max-w-4xl rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-10 text-center">
        <Inbox className="h-8 w-8 text-stone-600 mx-auto mb-3" />
        <p className="text-sm font-medium text-stone-300">No riders awaiting verification</p>
        <p className="text-xs text-stone-500 mt-1">
          When operators onboard a new rider with an ID, they'll appear here for review.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-3">
      <div className="text-xs text-stone-500">
        {pending.length} rider{pending.length !== 1 ? "s" : ""} awaiting ID verification.
      </div>

      <div className="space-y-2">
        {pending.map((rider) => (
          <PendingRow key={rider.id} rider={rider} onOpen={() => setSelected(rider)} />
        ))}
      </div>

      {selected && (
        <ReviewModal
          rider={selected}
          onClose={() => setSelected(null)}
          onDecision={onDecision}
        />
      )}
    </div>
  );
}

function PendingRow({ rider, onOpen }: { rider: Rider; onOpen: () => void }) {
  const initials = rider.name.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-orange-500/20 p-4 transition-all text-left group"
    >
      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-orange-300">{initials || "—"}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{rider.name}</p>
        <p className="text-[11px] text-stone-500 truncate">
          {rider.govtIdType && ID_TYPE_LABELS[rider.govtIdType]} · {rider.govtIdNumber || "no number"}
        </p>
      </div>
      <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider shrink-0">
        Pending
      </span>
      <ZoomIn className="h-4 w-4 text-stone-500 group-hover:text-orange-400 transition-colors shrink-0" />
    </button>
  );
}

function ReviewModal({
  rider, onClose, onDecision,
}: {
  rider: Rider;
  onClose: () => void;
  onDecision: (updated: Rider) => void;
}) {
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Fetch the full rider record including the base64 photo, since the pending
  // list endpoint includes it but a re-fetch keeps the data fresh.
  const [withPhoto, setWithPhoto] = useState<Rider>(rider);

  useEffect(() => {
    let alive = true;
    ridersApi.get(rider.id, { includePhoto: true })
      .then((r) => { if (alive) setWithPhoto(r); })
      .catch(() => { /* fall back to whatever the queue had */ });
    return () => { alive = false; };
  }, [rider.id]);

  async function handleApprove() {
    setBusy("approve");
    setError("");
    try {
      const updated = await ridersApi.verify(rider.id);
      onDecision(updated);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Couldn't approve. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectionReason.trim()) return;
    setBusy("reject");
    setError("");
    try {
      const updated = await ridersApi.reject(rider.id, rejectionReason.trim());
      onDecision(updated);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Couldn't reject. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl bg-[#0c1522] shadow-2xl shadow-black/50 border border-white/[0.08] overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Verify rider ID</p>
              <p className="text-[11px] text-stone-500">Compare the photo against the entered details.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-stone-600 hover:text-stone-300 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 overflow-y-auto">
          {/* Photo */}
          <div className="bg-black/30 p-4 flex items-center justify-center min-h-[300px]">
            {withPhoto.govtIdPhoto ? (
              <img
                src={withPhoto.govtIdPhoto}
                alt="Government ID"
                className="max-w-full max-h-[60vh] rounded-lg object-contain"
              />
            ) : (
              <div className="text-center text-stone-600">
                <ShieldAlert className="h-8 w-8 mx-auto mb-2" />
                <p className="text-xs">No photo uploaded</p>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-5 space-y-3 border-l border-white/[0.06]">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-stone-600 font-semibold">Rider</p>
              <p className="text-sm font-semibold text-white mt-0.5">{withPhoto.name}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-stone-600 font-semibold">Contact</p>
              <p className="text-[11px] text-stone-300 mt-0.5 flex items-center gap-1.5">
                <PhoneIcon className="h-2.5 w-2.5 text-stone-600" />
                <span className="font-mono">{withPhoto.phone}</span>
              </p>
              {withPhoto.email && (
                <p className="text-[11px] text-stone-500 flex items-center gap-1.5">
                  <Mail className="h-2.5 w-2.5 text-stone-600" />
                  {withPhoto.email}
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-stone-600 font-semibold">ID type</p>
              <p className="text-sm font-medium text-stone-200 mt-0.5">
                {withPhoto.govtIdType ? ID_TYPE_LABELS[withPhoto.govtIdType] : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-stone-600 font-semibold">ID number</p>
              <p className="text-sm font-mono text-stone-200 mt-0.5 break-all">
                {withPhoto.govtIdNumber || "—"}
              </p>
            </div>

            {error && (
              <p className="flex items-start gap-1.5 text-[11px] text-red-400 bg-red-500/[0.1] border border-red-500/20 rounded-lg px-3 py-2">
                <ShieldAlert className="h-3 w-3 shrink-0 mt-0.5" />{error}
              </p>
            )}

            {/* Reject form */}
            {showRejectForm ? (
              <form onSubmit={handleReject} className="space-y-2 pt-2">
                <label className="block text-[10px] uppercase tracking-wider text-stone-600 font-semibold">
                  Rejection reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Photo is blurry — please re-upload a clearer image of the front of the card."
                  required
                  rows={3}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-red-500/40 transition-colors resize-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowRejectForm(false); setRejectionReason(""); }}
                    disabled={busy === "reject"}
                    className="flex-none rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 h-8 text-[11px] font-medium text-stone-400 hover:text-white hover:bg-white/[0.06] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy === "reject" || !rejectionReason.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 h-8 text-[11px] font-semibold text-white disabled:opacity-60 transition-colors"
                  >
                    {busy === "reject" ? (
                      <><Loader2 className="h-3 w-3 animate-spin" /> Rejecting…</>
                    ) : (
                      "Send rejection"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  disabled={busy !== null}
                  className="flex-none rounded-lg border border-red-500/25 bg-red-500/[0.05] hover:bg-red-500/[0.1] px-3 h-9 text-[11px] font-semibold text-red-300 transition-all disabled:opacity-50"
                >
                  Reject…
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={busy !== null}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-emerald-500 to-emerald-600 h-9 text-xs font-semibold text-white shadow-sm shadow-emerald-500/20 disabled:opacity-60 transition-all"
                >
                  {busy === "approve" ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Approving…</>
                  ) : (
                    <><ShieldCheck className="h-3.5 w-3.5" /> Approve</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
