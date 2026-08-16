// Bridge palette: warm off-white paper, charcoal ink, soft coral accent,
// sage secondary, muted blue for links/actions, warm gray borders.
// Deliberately restrained — private scrapbook, not SaaS dashboard.

export const colors = {
  bg: '#F7F2EA',        // warm off-white "paper"
  bgRaised: '#FFFDF9',  // card surface
  bgSunken: '#EFE8DC',  // wells, inputs
  ink: '#2E2A26',       // charcoal text
  inkSoft: '#6F675E',   // secondary text
  inkFaint: '#A39A8E',  // tertiary / placeholders
  coral: '#E2795F',     // soft coral accent (primary actions, warmth)
  coralSoft: '#F6DED5', // coral tint for chips/badges
  sage: '#7E8B6F',      // sage/olive secondary
  sageSoft: '#E4E8DB',  // sage tint
  blue: '#5E7E9B',      // muted blue for links/actions
  blueSoft: '#DFE7EE',
  border: '#E3DACB',    // warm gray borders
  borderStrong: '#CFC4B2',
  danger: '#B3543F',
  night: '#332F3A',     // memory theme accents
  film: '#8C7A5B',
  white: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof colors;
