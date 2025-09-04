export const neoBrutalismTheme = {
  colors: {
    primary: {
      DEFAULT: '#ff3333',
      foreground: '#ffffff',
      hover: '#ff1111',
      dark: {
        DEFAULT: '#ff6666',
        foreground: '#000000',
      }
    },
    secondary: {
      DEFAULT: '#ffff00',
      foreground: '#000000',
      hover: '#ffff33',
      dark: {
        DEFAULT: '#ffff33',
        foreground: '#000000',
      }
    },
    accent: {
      DEFAULT: '#0066ff',
      foreground: '#ffffff',
      hover: '#0055dd',
      dark: {
        DEFAULT: '#3399ff',
        foreground: '#000000',
      }
    },
    success: {
      DEFAULT: '#00cc00',
      foreground: '#ffffff',
      border: '#009900',
      background: '#e6ffe6',
      dark: {
        DEFAULT: '#33cc33',
        foreground: '#000000',
      }
    },
    error: {
      DEFAULT: '#ff0000',
      foreground: '#ffffff',
      border: '#cc0000',
      background: '#ffe6e6',
      dark: {
        DEFAULT: '#ff3333',
        foreground: '#ffffff',
      }
    },
    warning: {
      DEFAULT: '#ff9900',
      foreground: '#000000',
      border: '#cc7700',
      background: '#fff9e6',
      dark: {
        DEFAULT: '#ffaa33',
        foreground: '#000000',
      }
    },
    muted: {
      DEFAULT: '#f0f0f0',
      foreground: '#333333',
      dark: {
        DEFAULT: '#333333',
        foreground: '#cccccc',
      }
    },
    background: {
      DEFAULT: '#ffffff',
      dark: '#000000',
    },
    foreground: {
      DEFAULT: '#000000',
      dark: '#ffffff',
    },
    border: {
      DEFAULT: '#000000',
      dark: '#ffffff',
    }
  },
  
  typography: {
    fonts: {
      sans: 'DM Sans, sans-serif',
      serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      mono: 'Space Mono, monospace',
    },
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
    },
    weights: {
      normal: 400,
      medium: 500,
      bold: 700,
      black: 900,
    },
    tracking: {
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    }
  },
  
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem',  // 64px
  },
  
  borders: {
    width: {
      thin: '1px',
      DEFAULT: '2px',
      thick: '3px',
      'extra-thick': '4px',
    },
    radius: {
      none: '0px',
      sm: '2px',
      DEFAULT: '4px',
      md: '6px',
      lg: '8px',
      full: '9999px',
    },
    style: 'solid',
  },
  
  shadows: {
    brutalism: {
      none: 'none',
      xs: '2px 2px 0px 0px rgba(0, 0, 0, 1)',
      sm: '3px 3px 0px 0px rgba(0, 0, 0, 1)',
      DEFAULT: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
      md: '5px 5px 0px 0px rgba(0, 0, 0, 1)',
      lg: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
      xl: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
    },
    hover: {
      xs: '1px 1px 0px 0px rgba(0, 0, 0, 1)',
      sm: '2px 2px 0px 0px rgba(0, 0, 0, 1)',
      DEFAULT: '2px 2px 0px 0px rgba(0, 0, 0, 1)',
    },
    active: 'none',
    focus: '0 0 0 3px rgba(255, 51, 51, 0.5)',
  },
  
  animations: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
    },
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    }
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  }
}

export type NeoBrutalismTheme = typeof neoBrutalismTheme

// Theme utility functions
export const getColor = (path: string, isDark = false): string => {
  const keys = path.split('.')
  let value: any = neoBrutalismTheme.colors
  
  for (const key of keys) {
    if (isDark && value[key]?.dark) {
      value = value[key].dark
    } else {
      value = value[key]
    }
  }
  
  return typeof value === 'string' ? value : value.DEFAULT || ''
}

export const getShadow = (size: keyof typeof neoBrutalismTheme.shadows.brutalism = 'DEFAULT'): string => {
  return neoBrutalismTheme.shadows.brutalism[size]
}

export const getHoverShadow = (size: keyof typeof neoBrutalismTheme.shadows.hover = 'DEFAULT'): string => {
  return neoBrutalismTheme.shadows.hover[size]
}