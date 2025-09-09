import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Target, Zap, ChevronRight } from "lucide-react"

interface DailyTaskCardProps {
  tasksCompleted: number
  tasksRequired: number
  streakMultiplier?: number
  estimatedEarnings?: number
  onStartTasks?: () => void
  className?: string
}

export function DailyTaskCard({
  tasksCompleted,
  tasksRequired,
  streakMultiplier = 1,
  estimatedEarnings = 5.00,
  onStartTasks,
  className
}: DailyTaskCardProps) {
  const progress = (tasksCompleted / tasksRequired) * 100
  const isComplete = tasksCompleted >= tasksRequired
  const remainingTasks = tasksRequired - tasksCompleted

  return (
    <div className={cn(
      "bg-card rounded-lg p-4 space-y-4",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Daily Goal</h3>
        </div>
        {streakMultiplier > 1 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 rounded text-xs">
            <Zap className="h-3 w-3 text-yellow-500" />
            <span className="text-yellow-600 font-medium">{streakMultiplier}x bonus</span>
          </div>
        )}
      </div>

      <div className="relative h-32 flex items-center justify-center">
        <svg className="absolute h-32 w-32 -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-secondary"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
            className={cn(
              "transition-all duration-500",
              isComplete ? "text-green-500" : "text-primary"
            )}
          />
        </svg>
        <div className="relative text-center">
          <p className="text-2xl font-bold">{tasksCompleted}/{tasksRequired}</p>
          <p className="text-xs text-muted-foreground">tasks</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Est. earnings</span>
          <span className="font-medium">
            ${(estimatedEarnings * streakMultiplier).toFixed(2)}
          </span>
        </div>
        
        {!isComplete ? (
          <Button 
            onClick={onStartTasks}
            className="w-full"
            size="lg"
          >
            {tasksCompleted === 0 ? 'Start Daily Tasks' : `Continue (${remainingTasks} left)`}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <div className="bg-green-500/10 text-green-600 rounded-lg p-3 text-center">
            <p className="font-medium">Daily goal complete! 🎉</p>
            <p className="text-xs mt-1">Come back tomorrow to maintain your streak</p>
          </div>
        )}
      </div>
    </div>
  )
}