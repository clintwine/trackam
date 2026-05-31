import { Link } from "react-router-dom";
import { ArrowLeft, Receipt, Sparkles } from "lucide-react";

/**
 * Placeholder for the wallet transactions page. Linked from the wallet
 * modal; will be replaced with a real ledger view (filterable list of
 * debits/credits, top-up history, search, export) in a follow-up.
 */
export default function WalletTransactionsPage() {
  return (
    <div className="max-w-3xl space-y-5">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>

      <div>
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Receipt className="h-4 w-4 text-orange-400" /> Wallet transactions
        </h2>
        <p className="text-sm text-stone-500 mt-1">
          Every credit, debit, and top-up against your OLI Switch wallet.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] py-12 text-center space-y-2">
        <div className="flex justify-center">
          <div className="h-10 w-10 rounded-lg bg-orange-500/15 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-orange-400" />
          </div>
        </div>
        <p className="text-sm font-medium text-stone-300">Transactions view coming soon</p>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          We're building a filterable ledger with top-ups, handover debits, and waybill fees.
          Check back shortly.
        </p>
      </div>
    </div>
  );
}
