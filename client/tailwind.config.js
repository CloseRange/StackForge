export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                panel: "#1a2540",
                ink: "#e2eaf6",
                ember: "#f97316",
                moss: "#34d399",
                steel: "#7dd3fc",
                /* Light mode colors - accessible via CSS variables */
                "light-bg-page": "var(--color-bg-page, #f8fafc)",
                "light-bg-surface": "var(--color-bg-surface, #ffffff)",
                "light-bg-muted": "var(--color-bg-muted, #f1f5f9)",
                "light-bg-subtle": "var(--color-bg-subtle, #f8fafc)",
                "light-text-primary": "var(--color-text-primary, #0f172a)",
                "light-text-secondary": "var(--color-text-secondary, #475569)",
                "light-text-muted": "var(--color-text-muted, #64748b)",
                "light-border": "var(--color-border, #e2e8f0)",
                "light-primary": "var(--color-primary, #2563eb)",
                "light-primary-hover": "var(--color-primary-hover, #1d4ed8)",
                "light-primary-soft": "var(--color-primary-soft, #dbeafe)"
            },
            fontFamily: {
                display: ["Sora", "ui-sans-serif", "system-ui"],
                body: ["Manrope", "ui-sans-serif", "system-ui"]
            },
            boxShadow: {
                glow: "0 24px 80px rgba(15, 23, 42, 0.4)"
            },
            backgroundImage: {
                "board-grid": "radial-gradient(circle at center, rgba(125, 211, 252, 0.08) 0, transparent 1px)"
            }
        }
    },
    plugins: []
};
