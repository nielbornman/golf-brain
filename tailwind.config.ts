import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        page: "hsl(var(--bg-page))",
        surface: "hsl(var(--bg-surface))",
        muted: "hsl(var(--bg-muted))",
        hover: "hsl(var(--bg-hover))",
        border: "hsl(var(--border))",
        divider: "hsl(var(--divider))",

        text: "hsl(var(--text))",
        "text-2": "hsl(var(--text-2))",
        "text-3": "hsl(var(--text-3))",

        action: "hsl(var(--action))",
        ring: "hsl(var(--ring))",
        selection: "hsl(var(--selection))",

        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))",
      },
      borderRadius: {
        sm: "var(--r-sm)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        pill: "var(--r-pill)",
      },
      boxShadow: {
        1: "var(--sh-1)",
        2: "var(--sh-2)",
      },
    },
  },
  plugins: [],
};

export default config;
