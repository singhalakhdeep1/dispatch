"use client";

import { useState } from "react";
import { Save, AlertTriangle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
    const [platformFee, setPlatformFee] = useState("5");
    const [minOrder, setMinOrder] = useState("99");
    const [maintenance, setMaintenance] = useState(false);
    const [saved, setSaved] = useState(false);

    const save = useMutation({
        mutationFn: () =>
            apiClient.patch("/v1/admin/settings", {
                platformFeePercent: parseFloat(platformFee),
                minOrderAmountPaise: Math.round(parseFloat(minOrder) * 100),
                maintenanceMode: maintenance,
            }),
        onSuccess: () => {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        },
    });

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">Platform Settings</h1>

            {maintenance && (
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-3 mb-5 text-sm">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    Maintenance mode is ON — all customer-facing routes will return 503.
                </div>
            )}

            <div className="rounded-2xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-6">
                {/* Platform fee */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Platform Fee (%)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                        Percentage charged on every delivered order (e.g. 5 = 5%).
                    </p>
                    <Input
                        type="number"
                        min="0"
                        max="30"
                        step="0.5"
                        value={platformFee}
                        onChange={(e) => setPlatformFee(e.target.value)}
                        className="max-w-xs"
                    />
                </div>

                <hr className="border-gray-100 dark:border-zinc-800" />

                {/* Min order amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Minimum Order Amount (₹)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                        Orders below this amount will be rejected at checkout.
                    </p>
                    <Input
                        type="number"
                        min="0"
                        step="1"
                        value={minOrder}
                        onChange={(e) => setMinOrder(e.target.value)}
                        className="max-w-xs"
                    />
                </div>

                <hr className="border-gray-100 dark:border-zinc-800" />

                {/* Maintenance mode */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-sm text-gray-700 dark:text-gray-300">Maintenance Mode</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Temporarily disable customer orders and restaurant access.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setMaintenance((v) => !v)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${maintenance ? "bg-orange-500" : "bg-gray-200"}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${maintenance ? "translate-x-6" : "translate-x-1"}`}
                        />
                    </button>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800" />

                <div className="flex items-center gap-3">
                    <Button
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => save.mutate()}
                        disabled={save.isPending}
                    >
                        <Save className="h-4 w-4 mr-1" />
                        {save.isPending ? "Saving…" : "Save Settings"}
                    </Button>
                    {saved && <span className="text-sm text-green-600 font-medium">Settings saved!</span>}
                    {save.isError && (
                        <span className="text-sm text-red-600">Failed to save. Try again.</span>
                    )}
                </div>
            </div>

            {/* Danger zone */}
            <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6 mt-6">
                <h2 className="font-bold text-red-700 dark:text-red-400 mb-1">Danger Zone</h2>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                    These actions are irreversible. Proceed with caution.
                </p>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Flush Redis Cache</p>
                            <p className="text-xs text-gray-500">Clear all cached restaurant menus, driver locations.</p>
                        </div>
                        <Button
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() =>
                                apiClient.post("/v1/admin/cache/flush").catch(() => null)
                            }
                        >
                            Flush
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
