import { cva, type VariantProps } from 'class-variance-authority'

// Neo Brutalism Button Variants
export const neoBrutalismButton = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-bold uppercase tracking-wide',
    'border-2 border-black',
    'transition-all duration-150',
    'outline-none',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-primary text-primary-foreground',
          'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
          'hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
          'hover:translate-x-0.5 hover:translate-y-0.5',
          'active:shadow-none active:translate-x-1 active:translate-y-1',
          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        ].join(' '),
        
        secondary: [
          'bg-secondary text-secondary-foreground',
          'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
          'hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
          'hover:translate-x-0.5 hover:translate-y-0.5',
          'active:shadow-none active:translate-x-1 active:translate-y-1',
          'focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2',
        ].join(' '),
        
        accent: [
          'bg-accent text-accent-foreground',
          'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
          'hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
          'hover:translate-x-0.5 hover:translate-y-0.5',
          'active:shadow-none active:translate-x-1 active:translate-y-1',
          'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        ].join(' '),
        
        success: [
          'bg-green-600 text-white border-green-800',
          'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
          'hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
          'hover:translate-x-0.5 hover:translate-y-0.5',
          'active:shadow-none active:translate-x-1 active:translate-y-1',
        ].join(' '),
        
        danger: [
          'bg-red-600 text-white border-red-800',
          'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
          'hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
          'hover:translate-x-0.5 hover:translate-y-0.5',
          'active:shadow-none active:translate-x-1 active:translate-y-1',
        ].join(' '),
        
        outline: [
          'bg-background text-foreground',
          'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
          'hover:bg-muted',
          'hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
          'hover:translate-x-0.5 hover:translate-y-0.5',
          'active:shadow-none active:translate-x-1 active:translate-y-1',
        ].join(' '),
        
        ghost: [
          'bg-transparent border-transparent',
          'hover:bg-muted hover:border-border',
          'text-foreground',
        ].join(' '),
      },
      
      size: {
        xs: 'text-xs px-2 py-1 min-h-[24px] [&_svg]:w-3 [&_svg]:h-3',
        sm: 'text-xs px-3 py-1.5 min-h-[32px] [&_svg]:w-3.5 [&_svg]:h-3.5',
        md: 'text-sm px-4 py-2 min-h-[40px] [&_svg]:w-4 [&_svg]:h-4',
        lg: 'text-base px-6 py-3 min-h-[48px] [&_svg]:w-5 [&_svg]:h-5',
        xl: 'text-lg px-8 py-4 min-h-[56px] [&_svg]:w-6 [&_svg]:h-6',
        icon: 'p-2 [&_svg]:w-4 [&_svg]:h-4',
      },
      
      fullWidth: {
        true: 'w-full',
        false: '',
      }
    },
    
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    }
  }
)

// Neo Brutalism Card Variants
export const neoBrutalismCard = cva(
  [
    'bg-background',
    'border-2 border-black',
    'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  ].join(' '),
  {
    variants: {
      variant: {
        default: '',
        primary: 'border-primary shadow-[4px_4px_0px_0px_rgba(255,51,51,1)]',
        secondary: 'border-secondary shadow-[4px_4px_0px_0px_rgba(255,255,0,1)]',
        accent: 'border-accent shadow-[4px_4px_0px_0px_rgba(0,102,255,1)]',
        success: 'border-green-500 bg-green-50 shadow-[4px_4px_0px_0px_rgba(0,204,0,1)]',
        error: 'border-red-500 bg-red-50 shadow-[4px_4px_0px_0px_rgba(255,0,0,1)]',
        warning: 'border-yellow-500 bg-yellow-50 shadow-[4px_4px_0px_0px_rgba(255,153,0,1)]',
      },
      
      interactive: {
        true: [
          'cursor-pointer',
          'transition-all duration-150',
          'hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
          'hover:translate-x-0.5 hover:translate-y-0.5',
          'active:shadow-none active:translate-x-1 active:translate-y-1',
        ].join(' '),
        false: '',
      },
      
      padding: {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      }
    },
    
    defaultVariants: {
      variant: 'default',
      interactive: false,
      padding: 'md',
    }
  }
)

// Neo Brutalism Badge Variants
export const neoBrutalismBadge = cva(
  [
    'inline-flex items-center justify-center',
    'font-bold uppercase text-xs tracking-wider',
    'border-2 border-black',
    'px-2 py-0.5',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'bg-muted text-foreground',
        primary: 'bg-primary text-primary-foreground border-primary',
        secondary: 'bg-secondary text-secondary-foreground border-secondary',
        accent: 'bg-accent text-accent-foreground border-accent',
        success: 'bg-green-100 text-green-800 border-green-800',
        error: 'bg-red-100 text-red-800 border-red-800',
        warning: 'bg-yellow-100 text-yellow-800 border-yellow-800',
        outline: 'bg-transparent text-foreground',
      },
      
      shadow: {
        true: 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
        false: '',
      }
    },
    
    defaultVariants: {
      variant: 'default',
      shadow: false,
    }
  }
)

// Neo Brutalism Input Variants
export const neoBrutalismInput = cva(
  [
    'w-full',
    'px-3 py-2',
    'bg-background text-foreground',
    'border-2 border-black',
    'font-mono',
    'outline-none',
    'transition-all duration-150',
    'placeholder:text-muted-foreground',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
          'focus:ring-2 focus:ring-primary',
        ].join(' '),
        
        error: [
          'border-red-500',
          'focus:shadow-[4px_4px_0px_0px_rgba(255,0,0,1)]',
          'focus:ring-2 focus:ring-red-500',
        ].join(' '),
        
        success: [
          'border-green-500',
          'focus:shadow-[4px_4px_0px_0px_rgba(0,204,0,1)]',
          'focus:ring-2 focus:ring-green-500',
        ].join(' '),
      },
      
      size: {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-3 py-2',
        lg: 'text-base px-4 py-3',
      }
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'md',
    }
  }
)

// Neo Brutalism Separator
export const neoBrutalismSeparator = cva(
  'bg-border',
  {
    variants: {
      orientation: {
        horizontal: 'h-[2px] w-full',
        vertical: 'w-[2px] h-full',
      },
      
      thickness: {
        thin: '',
        default: '',
        thick: '',
      }
    },
    
    compoundVariants: [
      {
        orientation: 'horizontal',
        thickness: 'thin',
        className: 'h-[1px]',
      },
      {
        orientation: 'horizontal',
        thickness: 'default',
        className: 'h-[2px]',
      },
      {
        orientation: 'horizontal',
        thickness: 'thick',
        className: 'h-[3px]',
      },
      {
        orientation: 'vertical',
        thickness: 'thin',
        className: 'w-[1px]',
      },
      {
        orientation: 'vertical',
        thickness: 'default',
        className: 'w-[2px]',
      },
      {
        orientation: 'vertical',
        thickness: 'thick',
        className: 'w-[3px]',
      },
    ],
    
    defaultVariants: {
      orientation: 'horizontal',
      thickness: 'default',
    }
  }
)

// Export variant prop types for TypeScript
export type ButtonVariantProps = VariantProps<typeof neoBrutalismButton>
export type CardVariantProps = VariantProps<typeof neoBrutalismCard>
export type BadgeVariantProps = VariantProps<typeof neoBrutalismBadge>
export type InputVariantProps = VariantProps<typeof neoBrutalismInput>
export type SeparatorVariantProps = VariantProps<typeof neoBrutalismSeparator>