import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./lib/**/*.{ts,tsx}",
        "../../packages/ui/src/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#f97316",
                    dark: "#ea580c",
                },
            },
        },
    },
    plugins: [],
};

export default config;
