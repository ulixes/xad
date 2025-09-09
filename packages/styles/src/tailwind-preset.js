const { colors, radii, spacing, typography } = require('./tokens')

/**
 * Shared Tailwind CSS preset for all apps in the monorepo
 * This ensures consistent styling across web, extension, and Storybook
 */

// Convert color tokens to Tailwind format
const tailwindColors = Object.fromEntries(
  Object.entries(colors).map(([key, value]) => {
    // Handle nested color objects (e.g., primary-foreground)
    if (key.includes('-foreground')) {
      return [key.replace('-foreground', ''), {
        DEFAULT: `hsl(var(--${key.replace('-foreground', '')}))`,
        foreground: `hsl(var(--${key}))`
      }]
    }
    // Skip foreground-only entries as they're handled above
    if (Object.keys(colors).includes(`${key}-foreground`)) {
      return null
    }
    // Regular colors
    return [key, `hsl(var(--${key}))`]
  }).filter(Boolean)
)

module.exports = {
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: tailwindColors,
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: [typography['font-sans']],
        serif: [typography['font-serif']],
        mono: [typography['font-mono']],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
}