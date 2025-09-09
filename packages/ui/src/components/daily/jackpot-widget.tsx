import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface JackpotWidgetProps {
  jackpotAmount: number
  hoursUntilDrawing: number
  minutesUntilDrawing: number
  isEligible?: boolean
  dailyTasksCompleted?: number
  dailyTasksRequired?: number
  onClick?: () => void
  className?: string
}

export function JackpotWidget({
  jackpotAmount,
  hoursUntilDrawing,
  minutesUntilDrawing,
  isEligible = false,
  dailyTasksCompleted = 0,
  dailyTasksRequired = 10,
  onClick,
  className
}: JackpotWidgetProps) {
  const progress = (dailyTasksCompleted / dailyTasksRequired) * 100
  
  return (
    <div
      className={cn(
        "w-full bg-card rounded-lg p-4",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">Daily Lottery:</span>
          <span className="font-medium">
            ${jackpotAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isEligible && (
            <span className="text-xs text-green-500">Entered</span>
          )}
          <span className="text-sm text-muted-foreground">
            {String(hoursUntilDrawing).padStart(2, '0')}:{String(minutesUntilDrawing).padStart(2, '0')}:00
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300",
              dailyTasksCompleted >= dailyTasksRequired ? "bg-green-500" : "bg-primary"
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Daily Actions</span>
          <span className="text-sm text-muted-foreground">
            {dailyTasksCompleted}/{dailyTasksRequired}
          </span>
        </div>
      </div>
      
      <Button
        onClick={onClick}
        className="w-full mt-3"
        variant={isEligible ? "secondary" : "default"}
      >
        {isEligible ? "View Details" : "Enter Lottery"}
      </Button>
    </div>
  )
}