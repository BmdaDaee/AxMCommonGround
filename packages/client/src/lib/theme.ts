/**
 * PASTEL PULSE – CommonGround Design System
 *
 * Replaces the earlier "Obsidian Sovereign" black/gold/purple identity
 * as of Aug 2026 -- deliberate pivot, not a bug. See canon decision log.
 *
 * A warm, organic aesthetic anchored in softness rather than severity:
 * Terracotta = grounded warmth, honesty
 * Sage = growth, steadiness
 * Lavender = introspection, calm
 *
 * Deliberately avoids sterile blues and aggressive reds -- even the
 * tension/crisis signal stays muted (clay rose) rather than alarm-red.
 *
 * Philosophy: fluid over rigid. Card-based and journey-driven layouts,
 * not standard grids. Color as warmth, not just signal.
 */

export const THEME = {
  colors: {
    // Core palette
    background: {
      base: '#F7F3EE',      // warm ivory – canvas
      elevated: '#FBF8F4',  // slightly lighter for layers
      surface: '#FFFFFF',   // cards, containers
      hover: '#EDE6DC',     // interactive states
    },

    primary: {
      DEFAULT: '#C97B5A',   // Terracotta – warmth, groundedness
      light: '#E0A184',
      dark: '#A85D3F',
    },

    accent: {
      DEFAULT: '#8BA888',   // Sage Green – growth, steadiness
      light: '#AFC7AC',
      dark: '#6B8768',
    },

    highlight: {
      DEFAULT: '#9B8AC4',   // Muted Lavender – introspection, calm
      light: '#B9ADD6',
      dark: '#7A6BA3',
    },

    text: {
      primary: '#3A332C',   // Warm charcoal – primary copy (not pure black)
      secondary: '#6B6259', // Warm gray – secondary info
      tertiary: '#9C9186',  // Muted – tertiary
      inverse: '#FBF8F4',   // For text on filled primary/accent surfaces
    },

    border: {
      DEFAULT: '#E8E0D5',   // Subtle borders
      strong: '#D8CDBE',    // Stronger dividers
      accent: '#8BA888',    // Sage accents
      primary: '#C97B5A',   // Terracotta accents
    },

    status: {
      aligned: '#7BA37E',       // Sage – healthy state
      stress: '#D19A5C',        // Amber-terracotta – warning
      tension: '#C97C87',       // Clay rose – critical, muted (not alarm-red)
      stale: '#B0A8B9',         // Muted lavender-gray – dormant
    },
  },

  typography: {
    fontFamily: {
      // Blueprint calls for a "street-royal logotype" for headers and a
      // readable serif for long-form mediation text. Not chosen/wired
      // yet -- flagged as a separate open decision, not silently bundled
      // into this color pivot.
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      serif: "Georgia, 'Times New Roman', serif", // placeholder for long-form therapy/mediation text
      mono: "'Courier Prime', 'Courier New', monospace",
    },

    size: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
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
    xs: '0 1px 2px 0 rgba(58, 51, 44, 0.06)',
    sm: '0 1px 3px 0 rgba(58, 51, 44, 0.08)',
    md: '0 4px 6px -1px rgba(58, 51, 44, 0.1)',
    lg: '0 10px 15px -3px rgba(58, 51, 44, 0.12)',
    xl: '0 20px 25px -5px rgba(58, 51, 44, 0.14)',
    terracotta: '0 0 20px rgba(201, 123, 90, 0.15)',
    sage: '0 0 20px rgba(139, 168, 136, 0.15)',
  },

  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export type Theme = typeof THEME;
