import { cn } from "@/lib/utils"
import { Flame } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DailyStreakWidgetProps {
  currentStreak: number
  tasksCompleted: number
  tasksRequired: number
  hasCompletedToday?: boolean
  onStartTasks?: () => void
  className?: string
}

export function DailyStreakWidget({
  currentStreak,
  tasksCompleted,
  tasksRequired,
  hasCompletedToday = false,
  onStartTasks,
  className
}: DailyStreakWidgetProps) {
  const progress = (tasksCompleted / tasksRequired) * 100
  const isComplete = tasksCompleted >= tasksRequired

  return (
    <div className={cn(
      "bg-card rounded-lg p-4 space-y-3",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-full",
            currentStreak > 0 ? "bg-orange-500/20" : "bg-muted"
          )}>
            <Flame className={cn(
              "h-5 w-5",
              currentStreak > 0 ? "text-orange-500 fill-orange-500" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Daily Streak</p>
            <p className="text-xl font-semibold">{currentStreak} days</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Today</span>
          <span className={cn(
            "font-medium",
            isComplete ? "text-green-500" : "text-foreground"
          )}>
            {tasksCompleted}/{tasksRequired}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300",
              isComplete ? "bg-green-500" : "bg-primary"
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {!isComplete && onStartTasks && (
        <Button 
          onClick={onStartTasks}
          className="w-full"
          size="sm"
        >
          Start Tasks
        </Button>
      )}
    </div>
  )
}