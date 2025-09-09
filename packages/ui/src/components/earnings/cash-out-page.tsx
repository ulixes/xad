import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EarningsWidget } from "@/components/earnings/earnings-widget"
import { ChevronLeft, Heart, MessageCircle, Repeat2, Share2, ArrowUp, Bookmark, UserPlus, Check } from "lucide-react"

export type TaskHistoryStatus = 'pending' | 'verified' | 'failed'

export interface TaskHistory {
  id: string
  type: 'like' | 'comment' | 'retweet' | 'share' | 'upvote' | 'save' | 'follow'
  status: TaskHistoryStatus
  url: string
  payment: number
  platform: 'tiktok' | 'instagram' | 'x' | 'reddit'
  completedAt: Date
  daysRemaining?: number
  hoursRemaining?: number
}

interface CashOutPageProps {
  availableEarnings: number
  taskHistory: TaskHistory[]
  onBack?: () => void
  onCashOut?: () => void
  className?: string
}

const taskTypeConfig = {
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

const getStatusDisplay = (status: TaskHistoryStatus, daysRemaining?: number, hoursRemaining?: number) => {
  switch (status) {
    case 'pending':
      if (hoursRemaining !== undefined && hoursRemaining < 24) {
        const hours = Math.floor(hoursRemaining)
        return {
          text: hours === 1 ? '1 hour' : `${hours} hours`,
          className: 'text-muted-foreground'
        }
      }
      if (daysRemaining !== undefined) {
        return {
          text: daysRemaining === 1 ? '1 day' : `${daysRemaining} days`,
          className: 'text-muted-foreground'
        }
      }
      return { text: 'Pending', className: 'text-muted-foreground' }
    case 'verified':
      return { text: '', className: '', showCheck: true }
    case 'failed':
      return { text: 'Failed', className: 'text-red-500' }
    default:
      return { text: 'Unknown', className: 'text-muted-foreground' }
  }
}

export function CashOutPage({
  availableEarnings,
  taskHistory,
  onBack,
  onCashOut,
  className
}: CashOutPageProps) {
  const totalPending = taskHistory
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.payment, 0)
  const totalVerified = taskHistory
    .filter(t => t.status === 'verified')
    .reduce((sum, t) => sum + t.payment, 0)
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
          {/* Earnings Widget */}
          <EarningsWidget pending={totalPending} available={totalVerified} />

          {/* Task History */}
          <div className="space-y-1">
            <h3 className="font-medium">Task History</h3>
            <p className="text-sm text-muted-foreground">
              Tasks remain pending for 7 days to verify completion
            </p>
          </div>

          <div className="space-y-2">
            {taskHistory.map((task) => {
              const config = taskTypeConfig[task.type]
              const Icon = config.icon
              const status = getStatusDisplay(task.status, task.daysRemaining, task.hoursRemaining)
              
              return (
                <div
                  key={task.id}
                  className="w-full bg-card rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon className={cn("w-4 h-4 flex-shrink-0", config.className)} />
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="font-medium">
                        {config.label} for ${task.payment.toFixed(2)}
                      </span>
                      <p className="text-sm text-primary hover:underline truncate w-full text-left">
                        {getCleanUrl(task.url)}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    {status.showCheck ? (
                      <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
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