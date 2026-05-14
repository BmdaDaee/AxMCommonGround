import type { Config } from 'tailwindcss';
import { THEME } from './src/lib/theme';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  
  theme: {
    extend: {
      colors: {
        bg: {
          base: THEME.colors.background.base,
          elevated: THEME.colors.background.elevated,
          surface: THEME.colors.background.surface,
          hover: THEME.colors.background.hover,
        },
        
        primary: {
          DEFAULT: THEME.colors.primary.DEFAULT,
          light: THEME.colors.primary.light,
          dark: THEME.colors.primary.dark,
        },
        
        accent: {
          DEFAULT: THEME.colors.accent.DEFAULT,
          light: THEME.colors.accent.light,
          dark: THEME.colors.accent.dark,
        },
        
        highlight: {
          DEFAULT: THEME.colors.highlight.DEFAULT,
          light: THEME.colors.highlight.light,
          dark: THEME.colors.highlight.dark,
        },
        
        text: {
          primary: THEME.colors.text.primary,
          secondary: THEME.colors.text.secondary,
          tertiary: THEME.colors.text.tertiary,
        },
        
        border: {
          DEFAULT: THEME.colors.border.DEFAULT,
          strong: THEME.colors.border.strong,
          accent: THEME.colors.border.accent,
          gold: THEME.colors.border.gold,
        },
        
        status: {
          aligned: THEME.colors.status.aligned,
          stress: THEME.colors.status.stress,
          tension: THEME.colors.status.tension,
          stale: THEME.colors.status.stale,
        },
      },
      
      fontFamily: {
        sans: THEME.typography.fontFamily.sans,
        mono: THEME.typography.fontFamily.mono,
      },
      
      fontSize: {
        xs: THEME.typography.size.xs,
        sm: THEME.typography.size.sm,
        base: THEME.typography.size.base,
        lg: THEME.typography.size.lg,
        xl: THEME.typography.size.xl,
        '2xl': THEME.typography.size['2xl'],
        '3xl': THEME.typography.size['3xl'],
        '4xl': THEME.typography.size['4xl'],
      },
      
      spacing: {
        xs: THEME.spacing.xs,
        sm: THEME.spacing.sm,
        md: THEME.spacing.md,
        lg: THEME.spacing.lg,
        xl: THEME.spacing.xl,
        '2xl': THEME.spacing['2xl'],
        '3xl': THEME.spacing['3xl'],
      },
      
      borderRadius: {
        xs: THEME.radius.xs,
        sm: THEME.radius.sm,
        md: THEME.radius.md,
        lg: THEME.radius.lg,
        xl: THEME.radius.xl,
      },
      
      boxShadow: {
        xs: THEME.shadows.xs,
        sm: THEME.shadows.sm,
        md: THEME.shadows.md,
        lg: THEME.shadows.lg,
        xl: THEME.shadows.xl,
        gold: THEME.shadows.gold,
        purple: THEME.shadows.purple,
      },
      
      transitionDuration: {
        fast: THEME.transitions.fast,
        base: THEME.transitions.base,
        slow: THEME.transitions.slow,
      },
      
      backgroundImage: {
        'gradient-gold': `linear-gradient(135deg, ${THEME.colors.primary.DEFAULT}, ${THEME.colors.primary.dark})`,
        'gradient-purple': `linear-gradient(135deg, ${THEME.colors.accent.DEFAULT}, ${THEME.colors.accent.dark})`,
      },
    },
  },
  
  darkMode: 'class',
  plugins: [],
};

export default config;
