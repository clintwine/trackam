import { useEffect, useState } from "react";
import { Wallet, RefreshCw } from "lucide-react";
import { walletApi, type WalletData } from "@/services/handover";
import { formatNaira } from "@/lib/format";

export default function WalletWidget() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const w = await walletApi.get();
      setWallet(w);
    } catch {
      // best-effort — OLI switch may be unavailable
    } finally {
      if (isRefresh) setRefreshing(false); else setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 rounded-md bg-secondary px-2.5 h-8 animate-pulse">
        <Wallet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="block w-14 h-2.5 rounded bg-muted-foreground/20" />
      </div>
    );
  }

  if (!wallet) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-md bg-secondary px-2.5 h-8" title="OLI Switch wallet balance">
      <Wallet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs font-medium text-foreground tabular-nums">
        {formatNaira(wallet.balance)}
      </span>
      <button
        onClick={() => load(true)}
        disabled={refreshing}
        className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 ml-0.5"
        aria-label="Refresh wallet balance"
      >
        <RefreshCw className={["h-3 w-3", refreshing ? "animate-spin" : ""].join(" ")} />
      </button>
    </div>
  );
}
