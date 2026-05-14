/**
 * OBSIDIAN SOVEREIGN – CommonGround Design System
 * 
 * A dark, editorial aesthetic anchored in duality:
 * Gold (Midas) = wealth, truth, sovereignty
 * Purple (Amethyst) = introspection, power, mystique
 * Red (Crisis) = attention, rupture, breakthrough
 * 
 * Philosophy: Stripped of ornament. Hierarchy through restraint.
 * Typography as structure. Color as signal.
 */

export const THEME = {
  colors: {
    // Core palette
    background: {
      base: '#080808',      // Deep black – canvas
      elevated: '#0F0F0F',  // Slightly lighter for layers
      surface: '#1A1A1A',   // Cards, containers
      hover: '#262626',     // Interactive states
    },
    
    primary: {
      DEFAULT: '#D4AF37',   // Midas Gold – sovereignty, truth
      light: '#E8C547',     // Lighter for highlights
      dark: '#B8860B',      // Darker for emphasis
    },
    
    accent: {
      DEFAULT: '#9D4EDD',   // Amethyst Purple – introspection
      light: '#C77DFF',     // Lighter
      dark: '#7209B7',      // Darker
    },
    
    highlight: {
      DEFAULT: '#E63946',   // Crisis Red – rupture, breakthrough
      light: '#FF6B7A',     // Lighter
      dark: '#D62828',      // Darker
    },
    
    text: {
      primary: '#F5F5F5',   // Off-white – primary copy
      secondary: '#B0B0B0', // Gray – secondary info
      tertiary: '#808080',  // Darker gray – muted
      inverse: '#080808',   // For high-contrast backgrounds
    },
    
    border: {
      DEFAULT: '#1E1E1E',   // Subtle borders
      strong: '#2A2A2A',    // Stronger dividers
      accent: '#9D4EDD',    // Purple accents
      gold: '#D4AF37',      // Gold accents
    },
    
    status: {
      aligned: '#10B981',   // Green – healthy state
      stress: '#F59E0B',    // Amber – warning
      tension: '#E63946',   // Red – critical
      stale: '#6B7280',     // Gray – dormant
    },
  },
  
  typography: {
    fontFamily: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "'Courier Prime', 'Courier New', monospace",
    },
    
    size: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
    },
    
    weight: {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  
  radius: {
    none: '0',
    xs: '0.125rem',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.6)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.7)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.8)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.9)',
    gold: '0 0 20px rgba(212, 175, 55, 0.2)',
    purple: '0 0 20px rgba(157, 78, 221, 0.2)',
  },
  
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export type Theme = typeof THEME;
