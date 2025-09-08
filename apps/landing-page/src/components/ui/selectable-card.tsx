import * as React from "react"
import { cn } from "../../lib/utils"
import { Circle, Check } from "lucide-react"

interface SelectableCardProps {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  title: string
  description?: string
  disabled?: boolean
  className?: string
  children?: React.ReactNode
  type?: 'radio' | 'checkbox'
  expandedContent?: React.ReactNode
}

export function SelectableCard({
  id,
  checked,
  onCheckedChange,
  title,
  description,
  disabled = false,
  className,
  children,
  type = 'checkbox',
  expandedContent
}: SelectableCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border transition-all",
        checked && "border-border bg-accent/50",
        !checked && "border-border",
        disabled && "opacity-50",
        className
      )}
    >
      <label
        htmlFor={id}
        className={cn(
          "flex items-center gap-3 p-3 cursor-pointer transition-colors select-none",
          checked && expandedContent ? "rounded-t-lg" : "rounded-lg",
          "hover:bg-accent/50",
          disabled && "cursor-not-allowed"
        )}
      >
      <button
        id={id}
        type="button"
        role={type}
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        onClick={(e) => {
          e.preventDefault()
          if (!disabled) {
            onCheckedChange(!checked)
          }
        }}
        disabled={disabled}
        className={cn(
          "aspect-square h-4 w-4 border ring-offset-background transition-all flex-shrink-0",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          type === 'radio' ? "rounded-full" : "rounded-sm",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-border"
        )}
      >
        {checked && (
          <span className="flex items-center justify-center">
            {type === 'radio' ? (
              <Circle className="h-2.5 w-2.5 fill-current" />
            ) : (
              <Check className="h-3 w-3" />
            )}
          </span>
        )}
      </button>
      <div className="flex-1 grid gap-1">
        <div className="font-medium text-sm leading-none">
          {title}
        </div>
        {description && (
          <div className="text-muted-foreground text-xs leading-snug">
            {description}
          </div>
        )}
        {children}
      </div>
    </label>
    {checked && expandedContent && (
      <div className="px-3 pb-3 space-y-3 animate-in slide-in-from-top-1 duration-200">
        {expandedContent}
      </div>
    )}
  </div>
  )
}