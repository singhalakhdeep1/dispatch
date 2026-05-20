import * as React from "react";
import { cn } from "../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "success" | "warning" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
    const variants: Record<string, string> = {
        default: "bg-orange-100 text-orange-800 border-orange-200",
        secondary: "bg-gray-100 text-gray-700 border-gray-200",
        destructive: "bg-red-100 text-red-700 border-red-200",
        success: "bg-green-100 text-green-700 border-green-200",
        warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
        outline: "border border-current bg-transparent",
    };

    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
                variants[variant],
                className,
            )}
            {...props}
        />
    );
}
