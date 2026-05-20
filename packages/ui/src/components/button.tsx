import * as React from "react";
import { cn } from "../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "ghost" | "secondary";
    size?: "sm" | "md" | "lg" | "icon";
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "md", isLoading, children, disabled, ...props }, ref) => {
        const base =
            "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

        const variants: Record<string, string> = {
            default: "bg-orange-500 text-white hover:bg-orange-600 shadow",
            destructive: "bg-red-500 text-white hover:bg-red-600",
            outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        };

        const sizes: Record<string, string> = {
            sm: "h-8 px-3 text-xs",
            md: "h-10 px-4 text-sm",
            lg: "h-11 px-6 text-base",
            icon: "h-10 w-10",
        };

        return (
            <button
                ref={ref}
                className={cn(base, variants[variant], sizes[size], className)}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && (
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                )}
                {children}
            </button>
        );
    },
);
Button.displayName = "Button";
