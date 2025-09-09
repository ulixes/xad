import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Plus, ChevronRight, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

interface ConnectedAccount {
  platform: string
  handle: string
  availableActions: number
  isVerifying?: boolean
}

interface HomeProps {
  pendingEarnings?: number
  availableEarnings?: number
  // Jackpot props
  jackpotAmount?: number
  hoursUntilDrawing?: number
  minutesUntilDrawing?: number
  secondsUntilDrawing?: number
  dailyActionsCompleted?: number
  dailyActionsRequired?: number
  // Wallet
  walletAddress?: string
  // Callbacks
  onAddAccount?: (platform: string, handle: string) => void
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
  dailyActionsCompleted = 0,
  dailyActionsRequired = 5,
  walletAddress = '0x1234...5678',
  onAddAccount,
  onAccountClick,
  onWalletClick,
  onJackpotClick,
  onCashOut,
  connectedAccounts = [],
  className
}: HomeProps) {
  // State for adding new accounts
  const [addingPlatform, setAddingPlatform] = useState<string | null>(null)
  const [handleInput, setHandleInput] = useState('')
  const [localAccounts, setLocalAccounts] = useState<ConnectedAccount[]>(connectedAccounts)
  
  // Update local accounts when props change
  useEffect(() => {
    setLocalAccounts(connectedAccounts)
  }, [connectedAccounts])
  
  const getAccountsForPlatform = (platformId: string) => {
    return localAccounts.filter(acc => acc.platform === platformId)
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
          {/* Earnings Section */}
          <div className="bg-card rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-around">
              <div className="flex flex-col items-center">
                <span className="text-sm text-muted-foreground mb-1">Pending</span>
                <span className="text-2xl font-semibold">
                  ${pendingEarnings.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm text-muted-foreground mb-1">Available</span>
                <span className="text-2xl font-semibold">
                  ${availableEarnings.toFixed(2)}
                </span>
              </div>
            </div>
            
            <Button 
              onClick={onCashOut}
              disabled={availableEarnings < 5}
              className="w-full"
              variant={availableEarnings < 5 ? "secondary" : "default"}
            >
              {availableEarnings < 5 
                ? `Withdraw ($5)`
                : `Withdraw $${availableEarnings.toFixed(2)}`
              }
            </Button>
          </div>

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
                      size="icon"
                      onClick={() => {
                        setAddingPlatform(platform.id)
                        setHandleInput('')
                      }}
                      className="h-8 w-8"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {addingPlatform === platform.id && (
                    <div className="w-full bg-card hover:bg-accent transition-colors rounded-lg p-3 flex items-center justify-between">
                      <Input
                        placeholder="Enter handle"
                        value={handleInput}
                        onChange={(e) => setHandleInput(e.target.value.replace('@', ''))}
                        className="h-8 mr-2 flex-1 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && handleInput.trim()) {
                            const cleanHandle = handleInput.trim().replace('@', '')
                            // Add the account locally with verifying state
                            setLocalAccounts(prev => [...prev, {
                              platform: platform.id,
                              handle: cleanHandle,
                              availableActions: 0,
                              isVerifying: true
                            }])
                            // Notify parent
                            onAddAccount?.(platform.id, cleanHandle)
                            setAddingPlatform(null)
                            setHandleInput('')
                          } else if (e.key === 'Escape') {
                            setAddingPlatform(null)
                            setHandleInput('')
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-8"
                        disabled={!handleInput.trim()}
                        onClick={() => {
                          if (handleInput.trim()) {
                            const cleanHandle = handleInput.trim().replace('@', '')
                            // Add the account locally with verifying state
                            setLocalAccounts(prev => [...prev, {
                              platform: platform.id,
                              handle: cleanHandle,
                              availableActions: 0,
                              isVerifying: true
                            }])
                            // Notify parent
                            onAddAccount?.(platform.id, cleanHandle)
                            setAddingPlatform(null)
                            setHandleInput('')
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  )}
                  
                  {accounts.length > 0 && (
                    <div className="space-y-2">
                      {accounts.map((account, idx) => {
                        const isVerifying = account.isVerifying
                        
                        return (
                          <button
                            key={`${account.platform}-${account.handle}-${idx}`}
                            onClick={() => !isVerifying && onAccountClick?.(account)}
                            disabled={isVerifying}
                            className={cn(
                              "w-full bg-card transition-colors rounded-lg p-3 flex items-center justify-between group",
                              isVerifying ? "opacity-60 cursor-not-allowed" : "hover:bg-accent"
                            )}
                          >
                            <div className="flex flex-col items-start">
                              <span className="font-medium">@{account.handle}</span>
                              <span className="text-sm text-muted-foreground">
                                {isVerifying ? "Verifying..." : `${account.availableActions} available actions`}
                              </span>
                            </div>
                            {isVerifying ? (
                              <Loader2 className="h-5 w-5 animate-spin text-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            )}
                          </button>
                        )
                      })}
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