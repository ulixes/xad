import * as React from "react"
import { cn } from "@/lib/utils"

interface ToggleGroupProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
  children: React.ReactNode
}

interface ToggleGroupItemProps {
  value: string
  className?: string
  children: React.ReactNode
  asChild?: boolean
}

const ToggleGroupContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
}>({
  value: "",
  onValueChange: () => {},
})

export function ToggleGroup({ value, onValueChange, className, children }: ToggleGroupProps) {
  return (
    <ToggleGroupContext.Provider value={{ value, onValueChange }}>
      <div className={cn("flex flex-wrap gap-2", className)}>
        {children}
      </div>
    </ToggleGroupContext.Provider>
  )
}

export function ToggleGroupItem({ value, className, children, asChild }: ToggleGroupItemProps) {
  const { value: selectedValue, onValueChange } = React.useContext(ToggleGroupContext)
  const isSelected = selectedValue === value
  
  const Comp = asChild ? React.Fragment : "button"
  const childProps = asChild ? {} : {
    type: "button" as const,
    onClick: () => onValueChange(value),
    className: cn(
      "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
      "border border-border",
      "hover:bg-accent hover:text-accent-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      isSelected && "bg-primary text-primary-foreground border-primary hover:bg-primary/90",
      !isSelected && "bg-transparent",
      className
    )
  }
  
  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement
    return React.cloneElement(child, {
      ...child.props,
      onClick: () => onValueChange(value),
      className: cn(
        "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "border border-border",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        isSelected && "bg-primary text-primary-foreground border-primary hover:bg-primary/90",
        !isSelected && "bg-transparent",
        className,
        child.props.className
      )
    })
  }
  
  return (
    <Comp {...childProps}>
      {children}
    </Comp>
  )
}