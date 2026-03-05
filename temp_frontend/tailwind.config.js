/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'Courier New', 'monospace'],
            },
            colors: {
                neon: {
                    indigo: 'hsl(var(--neon-indigo))',
                    cyan: 'hsl(var(--neon-cyan))',
                    purple: 'hsl(var(--neon-purple))',
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            animation: {
                'shimmer': 'shimmer 2s linear infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fadeInUp': 'fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'breathe': 'breathe 4s ease-in-out infinite',
                'glowPulse': 'glowPulse 4s ease-in-out infinite',
                'spinSlow': 'spinSlow 12s linear infinite',
                'spinSlowReverse': 'spinSlow 20s linear infinite reverse',
                'float': 'float 15s ease-in-out infinite alternate',
                'float-delayed': 'float 18s ease-in-out infinite alternate-reverse',
            },
            keyframes: {
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                fadeInUp: {
                    from: { opacity: 0, transform: 'translateY(20px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                },
                breathe: {
                    '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(59, 130, 246, 0)' },
                    '50%': { transform: 'scale(1.05)', boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)' },
                },
                glowPulse: {
                    '0%, 100%': { opacity: '0.2', transform: 'scale(1)' },
                    '50%': { opacity: '0.5', transform: 'scale(1.4)' },
                },
                spinSlow: {
                    from: { transform: 'rotate(0deg)' },
                    to: { transform: 'rotate(360deg)' },
                },
                float: {
                    '0%': { transform: 'translate(0, 0)' },
                    '50%': { transform: 'translate(-30px, 20px)' },
                    '100%': { transform: 'translate(20px, -40px)' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))',
            }
        },
    },
    plugins: [],
}
