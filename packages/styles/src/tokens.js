/**
 * Design tokens for the XAD design system
 * All color values are in HSL format without the hsl() wrapper
 * This ensures compatibility with Tailwind CSS v3
 */

const colors = {
  // Base colors
  background: '0 0% 4%',              // #0a0a0a - Near black
  foreground: '0 0% 93%',             // #ededed - Light gray
  
  // Card colors
  card: '0 0% 7%',                    // #111111 - Dark gray
  'card-foreground': '0 0% 93%',     // #ededed
  
  // Popover colors
  popover: '0 0% 10%',                // #1a1a1a - Slightly lighter than card
  'popover-foreground': '0 0% 93%',  // #ededed
  
  // Primary - Blue
  primary: '233 100% 65%',            // #4d61ff - Corrected HSL (was 229)
  'primary-foreground': '0 0% 100%', // #ffffff - White
  
  // Secondary - Dark gray
  secondary: '0 0% 15%',              // #262626
  'secondary-foreground': '0 0% 93%', // #ededed
  
  // Muted - Same as secondary for now
  muted: '0 0% 15%',                  // #262626
  'muted-foreground': '0 0% 64%',    // #a3a3a3 - Medium gray
  
  // Accent - Same as secondary for now
  accent: '0 0% 15%',                 // #262626
  'accent-foreground': '0 0% 93%',   // #ededed
  
  // Destructive - Red
  destructive: '0 72% 51%',           // #dc2626 - Corrected HSL
  'destructive-foreground': '0 0% 98%', // #fafafa - Near white
  
  // Form colors
  border: '0 0% 15%',                 // #262626
  input: '0 0% 10%',                  // #1a1a1a
  ring: '233 100% 65%',               // #4d61ff - Same as primary
  
  // Chart colors (keeping as HEX for now, can convert later)
  'chart-1': '142 76% 36%',           // #4ade80 green
  'chart-2': '199 89% 48%',           // #60a5fa blue
  'chart-3': '256 59% 59%',           // #a78bfa purple
  'chart-4': '41 90% 61%',            // #fbbf24 yellow
  'chart-5': '174 72% 56%',           // #2dd4bf teal
}

const spacing = {
  xs: '0.5rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
  xl: '3rem',
  '2xl': '4rem',
}

const radii = {
  none: '0',
  sm: 'calc(var(--radius) - 4px)',
  md: 'calc(var(--radius) - 2px)',
  lg: 'var(--radius)',
  xl: 'calc(var(--radius) + 4px)',
  full: '9999px',
}

const typography = {
  'font-sans': 'Outfit, system-ui, -apple-system, sans-serif',
  'font-serif': 'ui-serif, Georgia, Cambria, "Times New Roman", serif',
  'font-mono': 'ui-monospace, SFMono-Regular, "SF Mono", monospace',
}

// CSS variable values (not HSL wrapped)
const cssVariables = {
  '--radius': '0.5rem',
  '--font-sans': typography['font-sans'],
  '--font-serif': typography['font-serif'],
  '--font-mono': typography['font-mono'],
}

// Type exports removed for JS version

// Helper function to generate CSS variables
function generateCSSVariables() {
  const colorVars = Object.entries(colors)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join('\n')
  
  const otherVars = Object.entries(cssVariables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')
  
  return `:root {\n${colorVars}\n${otherVars}\n}`
}

// Export for CommonJS
module.exports = {
  colors,
  spacing,
  radii,
  typography,
  cssVariables,
  generateCSSVariables,
}