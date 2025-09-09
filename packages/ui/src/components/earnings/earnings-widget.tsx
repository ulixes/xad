import { cn } from "@/lib/utils"

interface EarningsWidgetProps {
  pending: number
  available: number
  className?: string
}

export function EarningsWidget({ pending, available, className }: EarningsWidgetProps) {
  return (
    <div className={cn(
      "flex items-center justify-around p-6 bg-card rounded-lg",
      className
    )}>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-semibold mb-1">
          ${pending.toFixed(2)}
        </span>
        <span className="text-sm text-muted-foreground">Pending</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-semibold mb-1">
          ${available.toFixed(2)}
        </span>
        <span className="text-sm text-muted-foreground">Available</span>
      </div>
    </div>
  )
}