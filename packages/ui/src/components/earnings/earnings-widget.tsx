import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EarningsWidgetProps {
  pending: number
  available: number
  onWithdraw?: () => void
  className?: string
}

export function EarningsWidget({ pending, available, onWithdraw, className }: EarningsWidgetProps) {
  const canWithdraw = available >= 5
  
  return (
    <div className={cn(
      "bg-card rounded-lg p-6 space-y-4",
      className
    )}>
      <div className="flex items-center justify-around">
        <div className="flex flex-col items-center">
          <span className="text-sm text-muted-foreground mb-1">Pending</span>
          <span className="text-2xl font-semibold">
            ${pending.toFixed(2)}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm text-muted-foreground mb-1">Available</span>
          <span className="text-2xl font-semibold">
            ${available.toFixed(2)}
          </span>
        </div>
      </div>
      
      <Button 
        onClick={onWithdraw}
        disabled={!canWithdraw}
        className="w-full"
        variant={!canWithdraw ? "secondary" : "default"}
      >
        {!canWithdraw 
          ? `Withdraw ($5)`
          : `Withdraw $${available.toFixed(2)}`
        }
      </Button>
    </div>
  )
}