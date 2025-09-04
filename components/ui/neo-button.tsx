import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'
import { neoBrutalismButton, type ButtonVariantProps } from '@/lib/theme/components'

export interface NeoButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
  asChild?: boolean
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export const NeoButton = React.forwardRef<HTMLButtonElement, NeoButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    asChild = false,
    loading = false,
    icon,
    iconPosition = 'left',
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : 'button'
    
    const renderContent = () => {
      if (loading) {
        return (
          <>
            <svg 
              className="animate-spin" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {children && <span>{children}</span>}
          </>
        )
      }
      
      if (icon && iconPosition === 'left') {
        return (
          <>
            {icon}
            {children && <span>{children}</span>}
          </>
        )
      }
      
      if (icon && iconPosition === 'right') {
        return (
          <>
            {children && <span>{children}</span>}
            {icon}
          </>
        )
      }
      
      return children
    }

    return (
      <Comp
        className={cn(neoBrutalismButton({ variant, size, fullWidth }), className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {renderContent()}
      </Comp>
    )
  }
)

NeoButton.displayName = 'NeoButton'