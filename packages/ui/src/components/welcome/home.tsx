import { Button } from "@/components/ui/button"
import { EarningsWidget } from "@/components/earnings/earnings-widget"
import { DailyStreakWidget } from "@/components/daily/daily-streak-widget"
import { JackpotWidget } from "@/components/daily/jackpot-widget"
import { cn } from "@/lib/utils"
import { Plus, ChevronRight } from "lucide-react"

interface ConnectedAccount {
  platform: string
  handle: string
  availableTasks: number
}

interface HomeProps {
  pendingEarnings?: number
  availableEarnings?: number
  // Daily task props
  currentStreak?: number
  dailyTasksCompleted?: number
  dailyTasksRequired?: number
  streakMultiplier?: number
  // Jackpot props
  jackpotAmount?: number
  jackpotTickets?: number
  daysUntilDrawing?: number
  // Callbacks
  onConnectAccount?: () => void
  onAddAccount?: (platform: string) => void
  onAccountClick?: (account: ConnectedAccount) => void
  onStartDailyTasks?: () => void
  connectedAccounts?: ConnectedAccount[]
  className?: string
}

const platforms = [
  { id: 'tiktok', name: 'TikTok' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'x', name: 'X' },
  { id: 'reddit', name: 'Reddit' }
]

export function Home({
  pendingEarnings = 0,
  availableEarnings = 0,
  currentStreak = 0,
  dailyTasksCompleted = 0,
  dailyTasksRequired = 5,
  streakMultiplier = 1,
  jackpotAmount = 50000,
  jackpotTickets = 0,
  daysUntilDrawing = 3,
  onConnectAccount,
  onAddAccount,
  onAccountClick,
  onStartDailyTasks,
  connectedAccounts = [],
  className
}: HomeProps) {
  const getAccountsForPlatform = (platformId: string) => {
    return connectedAccounts.filter(acc => acc.platform === platformId)
  }

  return (
    <div className={cn(
      "flex flex-col h-full min-h-screen w-full max-w-sm mx-auto",
      "bg-background",
      className
    )}>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-4">
          {/* Earnings Widget */}
          <EarningsWidget pending={pendingEarnings} available={availableEarnings} />

          {/* Daily Streak Widget */}
          <DailyStreakWidget 
            currentStreak={currentStreak}
            tasksCompleted={dailyTasksCompleted}
            tasksRequired={dailyTasksRequired}
            hasCompletedToday={dailyTasksCompleted >= dailyTasksRequired}
            onStartTasks={onStartDailyTasks}
          />

          {/* Jackpot Widget */}
          <JackpotWidget
            jackpotAmount={jackpotAmount}
            hoursUntilDrawing={Math.floor(daysUntilDrawing)}
            minutesUntilDrawing={45}
            isEligible={dailyTasksCompleted >= dailyTasksRequired}
          />

          <div className="space-y-2 pt-4">
            <h2 className="text-xl font-semibold tracking-tight">
              Connect Accounts
            </h2>
            <p className="text-sm text-muted-foreground">
              Connect your accounts to start earning
            </p>
          </div>

          <div className="space-y-4">
            {platforms.map((platform) => {
              const accounts = getAccountsForPlatform(platform.id)
              return (
                <div key={platform.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{platform.name}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAddAccount?.(platform.id)}
                      className="h-8"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Account
                    </Button>
                  </div>
                  
                  {accounts.length > 0 && (
                    <div className="space-y-2">
                      {accounts.map((account, idx) => (
                        <button
                          key={`${account.platform}-${account.handle}-${idx}`}
                          onClick={() => onAccountClick?.(account)}
                          className="w-full bg-card hover:bg-accent transition-colors rounded-lg p-3 flex items-center justify-between group"
                        >
                          <div className="flex flex-col items-start">
                            <span className="font-medium">@{account.handle}</span>
                            <span className="text-sm text-muted-foreground">
                              {account.availableTasks} available tasks
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
    </div>
  )
}