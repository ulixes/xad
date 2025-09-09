import { Button } from "@/components/ui/button"
import { EarningsWidget } from "@/components/earnings/earnings-widget"
import { cn } from "@/lib/utils"
import { Plus, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"

interface ConnectedAccount {
  platform: string
  handle: string
  availableTasks: number
}

interface HomeProps {
  pendingEarnings?: number
  availableEarnings?: number
  // Jackpot props
  jackpotAmount?: number
  hoursUntilDrawing?: number
  minutesUntilDrawing?: number
  secondsUntilDrawing?: number
  dailyTasksCompleted?: number
  dailyTasksRequired?: number
  // Wallet
  walletAddress?: string
  // Callbacks
  onAddAccount?: (platform: string) => void
  onAccountClick?: (account: ConnectedAccount) => void
  onWalletClick?: () => void
  onJackpotClick?: () => void
  onCashOut?: () => void
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
  jackpotAmount = 50000,
  hoursUntilDrawing = 3,
  minutesUntilDrawing = 45,
  secondsUntilDrawing = 0,
  dailyTasksCompleted = 0,
  dailyTasksRequired = 5,
  walletAddress = '0x1234...5678',
  onAddAccount,
  onAccountClick,
  onWalletClick,
  onJackpotClick,
  onCashOut,
  connectedAccounts = [],
  className
}: HomeProps) {
  const getAccountsForPlatform = (platformId: string) => {
    return connectedAccounts.filter(acc => acc.platform === platformId)
  }
  
  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    hours: hoursUntilDrawing,
    minutes: minutesUntilDrawing,
    seconds: secondsUntilDrawing
  })
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev
        
        if (seconds > 0) {
          seconds--
        } else if (minutes > 0) {
          minutes--
          seconds = 59
        } else if (hours > 0) {
          hours--
          minutes = 59
          seconds = 59
        } else {
          // Timer reached 0, reset to 24 hours
          return { hours: 24, minutes: 0, seconds: 0 }
        }
        
        return { hours, minutes, seconds }
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={cn(
      "flex flex-col h-full min-h-screen w-full max-w-sm mx-auto",
      "bg-background",
      className
    )}>
      {/* Header */}
      <div className="border-b border-border">
        <div className="flex items-center justify-between p-4">
          {/* Lottery info */}
          <Button
            variant="outline"
            size="sm"
            onClick={onJackpotClick}
            className="h-8"
          >
            <span className="text-sm">
              ${Math.round(jackpotAmount/1000)}k in {timeLeft.hours}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </Button>
          
          {/* Wallet button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onWalletClick}
            className="h-8"
          >
            {walletAddress}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Earnings Widget */}
          <EarningsWidget 
            pending={pendingEarnings} 
            available={availableEarnings} 
            onWithdraw={onCashOut}
          />

          <div className="pt-4">
            <h2 className="text-xl font-semibold tracking-tight">
              Connect Accounts
            </h2>
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