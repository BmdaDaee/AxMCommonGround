/**
 * PASTEL PULSE — CommonGround Design System (mobile)
 *
 * Replaces the earlier "Obsidian Sovereign" black/gold identity as of
 * Aug 2026 -- deliberate pivot, not a bug. See handoff doc / canon notes
 * for the decision record.
 *
 * Philosophy: warm, organic, fluid. Soft terracottas, sage greens, muted
 * lavenders. Deliberately avoids sterile blues and aggressive reds --
 * even the "crisis/tension" signal color stays muted (clay rose, not red).
 *
 * DeeplyUs keeps its own separate identity (dark burgundy/blush) --
 * untouched by this pivot. Two brand surfaces, one app.
 */

const commonGround = {
  colors: {
    background: {
      base: '#F7F3EE',      // warm ivory canvas
      elevated: '#FBF8F4',
      surface: '#FFFFFF',   // cards
      hover: '#EDE6DC',     // pressed/interactive states
    },

    primary: {
      DEFAULT: '#C97B5A',   // terracotta
      light: '#E0A184',
      dark: '#A85D3F',
    },

    accent: {
      DEFAULT: '#8BA888',   // sage green
      light: '#AFC7AC',
      dark: '#6B8768',
    },

    highlight: {
      DEFAULT: '#9B8AC4',   // muted lavender
      light: '#B9ADD6',
      dark: '#7A6BA3',
    },

    text: {
      primary: '#3A332C',   // warm charcoal, not pure black
      secondary: '#6B6259',
      tertiary: '#9C9186',
      inverse: '#FBF8F4',   // for text on filled primary/accent surfaces
    },

    border: {
      DEFAULT: '#E8E0D5',
      strong: '#D8CDBE',
      accent: '#8BA888',    // sage
      primary: '#C97B5A',   // terracotta
    },

    // Relational Engine state colors -- muted throughout, including the
    // tension/crisis end. No aggressive red anywhere in this palette.
    status: {
      aligned: '#7BA37E',      // sage
      dormant: '#B0A8B9',      // muted lavender-gray
      misaligned: '#D19A5C',   // warm amber-terracotta
      capacityBlocked: '#C9A66B', // dusty gold-amber
      trustFractured: '#C97C87',  // clay rose -- urgency without aggression
    },
  },

  typography: {
    // NOTE: the blueprint calls for a "street-royal logotype" for headers
    // and serif for long-form mediation text. Not implemented yet --
    // flagging as a separate open decision, not silently bundled into
    // this color pivot. Using existing sans stack until a font choice
    // is confirmed.
    fontFamily: {
      sans: 'System',
      serif: 'System', // placeholder -- swap once a serif is chosen for long-form text
    },
    size: {
      xs: 11,
      sm: 13,
      base: 15,
      lg: 18,
      xl: 22,
      '2xl': 28,
      '3xl': 34,
    },
    weight: {
      light: '300' as const,
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },

  radius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 20,
    full: 9999,
  },
} as const;

const deeplyUs = {
  colors: {
    background: {
      base: '#3A2028',
      elevated: '#452530',
      surface: '#4E2A38',
      hover: '#5A3240',
    },
    primary: {
      DEFAULT: '#F7D6D9',
      light: '#FCE8EA',
      dark: '#E8B4B9',
    },
    accent: {
      DEFAULT: '#F7D6D9',
      light: '#FCE8EA',
      dark: '#E8B4B9',
    },
    highlight: {
      DEFAULT: '#F7D6D9',
      light: '#FCE8EA',
      dark: '#E8B4B9',
    },
    text: {
      primary: '#F7EBEC',
      secondary: '#D9BEC2',
      tertiary: '#B8969C',
      inverse: '#3A2028',
    },
    border: {
      DEFAULT: '#5A3240',
      strong: '#6B3C4B',
      accent: '#F7D6D9',
      primary: '#F7D6D9',
    },
    status: {
      aligned: '#F7D6D9',
      dormant: '#B8969C',
      misaligned: '#D9A0A8',
      capacityBlocked: '#C98F98',
      trustFractured: '#C97C87',
    },
  },
  typography: commonGround.typography,
  spacing: commonGround.spacing,
  radius: commonGround.radius,
} as const;

export const THEME = {
  commonGround,
  deeplyUs,
};

export function getTheme(isDeeplyUs: boolean) {
  return isDeeplyUs ? deeplyUs : commonGround;
}

export type Theme = typeof commonGround;
