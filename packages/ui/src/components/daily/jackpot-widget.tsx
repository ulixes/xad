import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface JackpotWidgetProps {
  jackpotAmount: number
  hoursUntilDrawing: number
  minutesUntilDrawing: number
  isEligible?: boolean
  className?: string
}

export function JackpotWidget({
  jackpotAmount,
  hoursUntilDrawing,
  minutesUntilDrawing,
  isEligible = false,
  className
}: JackpotWidgetProps) {
  const [displayAmount, setDisplayAmount] = useState(jackpotAmount - 100)

  // Animate the jackpot amount
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayAmount(jackpotAmount)
    }, 100)
    return () => clearTimeout(timer)
  }, [jackpotAmount])

  return (
    <div className={cn(
      "bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-purple-600/20 rounded-lg p-4 space-y-2",
      className
    )}>
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">Daily Jackpot</p>
        <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
          ${displayAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {hoursUntilDrawing}h {minutesUntilDrawing}m
        </p>
      </div>

      {isEligible && (
        <div className="text-center">
          <p className="text-xs text-green-500">Entered ✓</p>
        </div>
      )}
    </div>
  )
}