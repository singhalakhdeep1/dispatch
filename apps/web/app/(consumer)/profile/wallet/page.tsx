"use client";

import { Wallet, ArrowUpRight, ArrowDownLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/lib/api/cart";

function formatRupees(paise: number) { return `₹${(paise / 100).toFixed(2)}`; }

export default function WalletPage() {
    const { data: walletData, isLoading } = useWallet();

    const balance: number = walletData?.balance ?? 0;
    const transactions: any[] = walletData?.transactions ?? [];

    return (
        <div className="max-w-lg mx-auto">
            {/* Balance card */}
            <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 mb-5">
                <div className="flex items-center gap-2 mb-4">
                    <Wallet className="h-5 w-5 opacity-80" />
                    <span className="text-sm opacity-80">OrderHub Wallet</span>
                </div>
                <div className="text-4xl font-bold mb-1">{formatRupees(balance)}</div>
                <p className="text-sm opacity-75">Available balance</p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <Button variant="outline" className="h-12 gap-2">
                    <Plus className="h-4 w-4" /> Add Money
                </Button>
                <Button variant="outline" className="h-12 gap-2">
                    <ArrowUpRight className="h-4 w-4" /> Transfer
                </Button>
            </div>

            {/* Transactions */}
            <h2 className="font-bold text-base mb-3">Transaction History</h2>
            {isLoading ? (
                <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-xl bg-zinc-100 animate-pulse" />)}</div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-zinc-400">
                    <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No transactions yet</p>
                </div>
            ) : (
                <div className="rounded-2xl border dark:border-zinc-800 overflow-hidden">
                    {transactions.map((tx: any, i: number) => {
                        const isCredit = tx.type === "CREDIT" || tx.type === "REFUND";
                        return (
                            <div key={tx.id} className={`flex items-center gap-3 px-4 py-3.5 ${i !== transactions.length - 1 ? "border-b dark:border-zinc-800" : ""}`}>
                                <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${isCredit ? "bg-green-100 dark:bg-green-950" : "bg-red-100 dark:bg-red-950"}`}>
                                    {isCredit
                                        ? <ArrowDownLeft className="h-4 w-4 text-green-600" />
                                        : <ArrowUpRight className="h-4 w-4 text-red-500" />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{tx.description ?? tx.type}</p>
                                    <p className="text-xs text-zinc-400">{new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                                </div>
                                <span className={`font-bold text-sm ${isCredit ? "text-green-600" : "text-red-500"}`}>
                                    {isCredit ? "+" : "-"}{formatRupees(Math.abs(tx.amount))}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
