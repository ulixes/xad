import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Neo Brutalism specific utility functions
export const neoBrutalism = {
  // Shadow utilities
  shadow: {
    xs: 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
    sm: 'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
    DEFAULT: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    md: 'shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]',
    lg: 'shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
    xl: 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]',
  },
  
  // Hover shadow utilities
  hoverShadow: {
    xs: 'hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]',
    sm: 'hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
    DEFAULT: 'hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
  },
  
  // Transform utilities for button interactions
  transform: {
    hover: 'hover:translate-x-0.5 hover:translate-y-0.5',
    active: 'active:translate-x-1 active:translate-y-1 active:shadow-none',
  },
  
  // Border utilities
  border: {
    DEFAULT: 'border-2 border-black',
    primary: 'border-2 border-primary',
    secondary: 'border-2 border-secondary',
    accent: 'border-2 border-accent',
    success: 'border-2 border-green-600',
    error: 'border-2 border-red-600',
    warning: 'border-2 border-yellow-600',
  },
  
  // Typography utilities
  typography: {
    heading: 'font-black uppercase tracking-wide',
    subheading: 'font-bold uppercase tracking-wide text-sm',
    body: 'font-bold',
    caption: 'font-bold text-xs uppercase tracking-wider',
  },
}

// Format utilities
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`
}

export const formatDate = (date: Date | string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}