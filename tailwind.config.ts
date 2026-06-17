import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: "#FFFFFF",
                secondary: "#FAF8F4",
                gold: {
                    DEFAULT: "#C9A14A",
                    hover: "#B58F3B",
                    light: "rgba(201, 161, 74, 0.1)",
                },
                rosegold: "#E0BFB8",
                silver: "#D8D8D8",
                text: {
                    dark: "#1A1A1A",
                    light: "#FFFFFF",
                    muted: "#666666",
                },
                champagne: {
                    bg: "#FAF8F4",
                    accent: "#C9A14A",
                    text: "#1A1A1A",
                },
                emerald: {
                    bg: "#FAF8F4",
                    accent: "#C9A14A",
                    text: "#1A1A1A",
                },
                burgundy: {
                    bg: "#FAF8F4",
                    accent: "#C9A14A",
                    text: "#1A1A1A",
                },
                diamond: {
                    bg: "#FFFFFF",
                    accent: "#C9A14A",
                    text: "#1A1A1A",
                }
            },
            fontFamily: {
                heading: ["var(--font-playfair)", "serif"],
                body: ["var(--font-inter)", "sans-serif"],
            },
            transitionTimingFunction: {
                smooth: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            },
        },
    },
    plugins: [],
};
export default config;
