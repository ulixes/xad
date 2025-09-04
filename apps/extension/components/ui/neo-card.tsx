import * as React from 'react'
import { cn } from '@/lib/utils'
import { neoBrutalismCard, type CardVariantProps } from '@/lib/theme/components'

export interface NeoCardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    CardVariantProps {}

export const NeoCard = React.forwardRef<HTMLDivElement, NeoCardProps>(
  ({ className, variant, interactive, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(neoBrutalismCard({ variant, interactive, padding }), className)}
        {...props}
      />
    )
  }
)

NeoCard.displayName = 'NeoCard'

export interface NeoCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'warning'
}

export const NeoCardHeader = React.forwardRef<HTMLDivElement, NeoCardHeaderProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'border-b-2 border-black',
      primary: 'border-b-2 border-primary bg-primary/10',
      secondary: 'border-b-2 border-secondary bg-secondary/10',
      accent: 'border-b-2 border-accent bg-accent/10',
      success: 'border-b-2 border-green-500 bg-green-50',
      error: 'border-b-2 border-red-500 bg-red-50',
      warning: 'border-b-2 border-yellow-500 bg-yellow-50',
    }
    
    return (
      <div
        ref={ref}
        className={cn('p-4', variantClasses[variant], className)}
        {...props}
      />
    )
  }
)

NeoCardHeader.displayName = 'NeoCardHeader'

export interface NeoCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const NeoCardTitle = React.forwardRef<HTMLHeadingElement, NeoCardTitleProps>(
  ({ className, size = 'lg', ...props }, ref) => {
    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    }
    
    return (
      <h3
        ref={ref}
        className={cn(
          'font-black uppercase tracking-wide',
          sizeClasses[size],
          className
        )}
        {...props}
      />
    )
  }
)

NeoCardTitle.displayName = 'NeoCardTitle'

export const NeoCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('p-4', className)}
      {...props}
    />
  )
})

NeoCardContent.displayName = 'NeoCardContent'

export const NeoCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('p-4 border-t-2 border-black', className)}
      {...props}
    />
  )
})

NeoCardFooter.displayName = 'NeoCardFooter'