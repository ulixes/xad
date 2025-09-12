import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Heart, MessageCircle, Repeat2, Share2, ArrowUp, Bookmark, UserPlus, DollarSign } from "lucide-react"

export type ActionHistoryStatus = 'pending' | 'verified' | 'failed'

export interface ActionHistory {
  id: string
  type: 'like' | 'comment' | 'retweet' | 'share' | 'upvote' | 'save' | 'follow'
  status: ActionHistoryStatus
  url: string
  payment: number
  platform: 'tiktok' | 'instagram' | 'x' | 'reddit'
  completedAt: Date
  daysRemaining?: number
  hoursRemaining?: number
}

interface WithdrawPageProps {
  availableEarnings: number
  actionHistory: ActionHistory[]
  onBack?: () => void
  onCashOut?: () => void
  className?: string
}

const actionTypeConfig = {
  like: { icon: Heart, label: 'Liked', className: 'text-red-500 fill-red-500' },
  comment: { icon: MessageCircle, label: 'Commented', className: 'text-foreground fill-foreground' },
  retweet: { icon: Repeat2, label: 'Retweeted', className: 'text-green-500' },
  share: { icon: Share2, label: 'Shared', className: 'text-purple-500' },
  upvote: { icon: ArrowUp, label: 'Upvoted', className: 'text-orange-500 fill-orange-500' },
  save: { icon: Bookmark, label: 'Saved', className: 'text-yellow-500 fill-yellow-500' },
  follow: { icon: UserPlus, label: 'Followed', className: 'text-blue-500 fill-blue-500' },
}

const getCleanUrl = (url: string): string => {
  return url
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/^tiktok\.com/, '')
    .replace(/^instagram\.com/, '')
    .replace(/^x\.com/, '')
    .replace(/^twitter\.com/, '')
    .replace(/^reddit\.com/, '')
}

const getStatusDisplay = (status: ActionHistoryStatus, daysRemaining?: number, hoursRemaining?: number) => {
  switch (status) {
    case 'pending':
      if (hoursRemaining !== undefined && hoursRemaining < 24) {
        const hours = Math.floor(hoursRemaining)
        return {
          text: hours === 1 ? '1 hour' : `${hours} hours`,
          className: 'text-foreground'
        }
      }
      if (daysRemaining !== undefined) {
        return {
          text: daysRemaining === 1 ? '1 day' : `${daysRemaining} days`,
          className: 'text-foreground'
        }
      }
      return { text: 'Pending', className: 'text-foreground' }
    case 'verified':
      return { text: '', className: '', showCheck: true }
    case 'failed':
      return { text: 'Failed', className: 'text-red-500' }
    default:
      return { text: 'Unknown', className: 'text-muted-foreground' }
  }
}

export function WithdrawPage({
  availableEarnings,
  actionHistory,
  onBack,
  onCashOut,
  className
}: WithdrawPageProps) {
  const totalPending = actionHistory
    .filter(a => a.status === 'pending')
    .reduce((sum, a) => sum + a.payment, 0)
  const totalVerified = actionHistory
    .filter(a => a.status === 'verified')
    .reduce((sum, a) => sum + a.payment, 0)
  const canCashOut = totalVerified >= 5

  return (
    <div className={cn(
      "flex flex-col h-full min-h-screen w-full max-w-sm mx-auto",
      "bg-background",
      className
    )}>
      {/* Header */}
      <div className="border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">Withdraw</span>
          <div className="w-8" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4 pb-24">
          {/* Earnings Section */}
          <div className="bg-card rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-around">
              <div className="flex flex-col items-center">
                <span className="text-sm text-muted-foreground mb-1">Pending</span>
                <span className="text-2xl font-semibold">
                  ${totalPending.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm text-muted-foreground mb-1">Available</span>
                <span className="text-2xl font-semibold">
                  ${totalVerified.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Action History */}
          <div className="space-y-1">
            <h3 className="font-medium">Action History</h3>
            <p className="text-sm text-muted-foreground">
              Actions remain pending for 7 days to verify completion
            </p>
          </div>

          <div className="space-y-2">
            {actionHistory.map((action) => {
              const config = actionTypeConfig[action.type]
              const Icon = config.icon
              const status = getStatusDisplay(action.status, action.daysRemaining, action.hoursRemaining)
              
              return (
                <div
                  key={action.id}
                  className="w-full bg-card rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon className={cn("w-4 h-4 flex-shrink-0", config.className)} />
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="font-medium">
                        {config.label} for ${action.payment.toFixed(2)}
                      </span>
                      <p className="text-sm text-primary hover:underline truncate w-full text-left">
                        {getCleanUrl(action.url)}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    {status.showCheck ? (
                      <DollarSign className="w-4 h-4 text-green-500" />
                    ) : (
                      <span className={cn("text-xs", status.className)}>
                        {status.text}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Fixed footer with gradient background */}
      <div className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-gradient-to-t from-background via-background to-transparent pt-6 pb-6 px-4">
        <div className="bg-background">
          <Button 
            onClick={onCashOut}
            disabled={!canCashOut}
            className="w-full"
            size="lg"
          >
            {canCashOut 
              ? `Withdraw $${totalVerified.toFixed(2)}`
              : `Withdraw ($5)`
            }
          </Button>
        </div>
      </div>
    </div>
  )
}