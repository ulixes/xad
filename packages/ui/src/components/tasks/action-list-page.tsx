import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, Loader2, X, Heart, MessageCircle, Repeat2, Share2, ArrowUp, Bookmark, UserRoundPlus, ChevronLeft } from "lucide-react"

export type ActionStatus = 'pending' | 'loading' | 'completed' | 'error'

export interface Action {
  id: string
  type: 'like' | 'comment' | 'retweet' | 'share' | 'upvote' | 'save' | 'follow'
  status: TaskStatus
  url: string
  payment: number
  errorMessage?: string
  platform: 'tiktok' | 'instagram' | 'x' | 'reddit'
}

interface ActionListPageProps {
  accountHandle: string
  platform: 'tiktok' | 'instagram' | 'x' | 'reddit'
  actions: Action[]
  availableActionsCount: number
  onStartActions?: () => void
  onActionClick?: (actionId: string) => void
  onBack?: () => void
  className?: string
}

const actionTypeConfig = {
  like: { icon: Heart, label: 'Like', className: 'text-red-500 fill-red-500' },
  comment: { icon: MessageCircle, label: 'Comment', className: 'text-foreground fill-foreground' },
  retweet: { icon: Repeat2, label: 'Retweet', className: 'text-green-500' },
  share: { icon: Share2, label: 'Share', className: 'text-purple-500' },
  upvote: { icon: ArrowUp, label: 'Upvote', className: 'text-orange-500 fill-orange-500' },
  save: { icon: Bookmark, label: 'Save', className: 'text-yellow-500 fill-yellow-500' },
  follow: { icon: UserRoundPlus, label: 'Follow', className: 'text-blue-500 fill-blue-500' }
}

const platformActionTypes: Record<string, Array<Action['type']>> = {
  tiktok: ['like', 'comment', 'share', 'follow'],
  instagram: ['like', 'comment', 'save', 'follow'],
  x: ['like', 'comment', 'retweet', 'follow'],
  reddit: ['upvote', 'comment', 'save']
}

export function ActionListPage({
  accountHandle,
  platform,
  actions,
  availableActionsCount,
  onStartActions,
  onActionClick,
  onBack,
  className
}: ActionListPageProps) {
  const renderActionStatus = (status: ActionStatus) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-5 h-5" />
        )
      case 'loading':
        return (
          <Loader2 className="w-5 h-5 animate-spin text-foreground" />
        )
      case 'completed':
        return (
          <Check className="w-4 h-4 text-foreground" />
        )
      case 'error':
        return (
          <X className="w-4 h-4 text-destructive" />
        )
    }
  }

  const truncateUrl = (url: string, platform: string) => {
    // Remove protocol
    let displayUrl = url.replace(/^https?:\/\//, '')
    // Remove www
    displayUrl = displayUrl.replace(/^www\./, '')
    
    // Remove platform-specific domains
    const platformDomains: Record<string, string[]> = {
      tiktok: ['tiktok.com/', 'm.tiktok.com/'],
      instagram: ['instagram.com/', 'www.instagram.com/'],
      x: ['x.com/', 'twitter.com/'],
      reddit: ['reddit.com/', 'old.reddit.com/', 'www.reddit.com/']
    }
    
    const domains = platformDomains[platform] || []
    for (const domain of domains) {
      if (displayUrl.startsWith(domain)) {
        displayUrl = displayUrl.substring(domain.length)
        break
      }
    }
    
    // Truncate if too long (increased limit since we removed domain)
    if (displayUrl.length > 40) {
      return displayUrl.substring(0, 37) + '...'
    }
    return displayUrl
  }

  return (
    <div className={cn(
      "flex flex-col h-screen w-full max-w-sm mx-auto",
      "bg-background",
      className
    )}>
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pb-24 space-y-4">
          {/* Header with back button and account */}
          <div className="flex items-center relative">
            <button
              onClick={onBack}
              className="absolute left-0 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-accent transition-colors -ml-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 text-center">
              <span className="font-medium">@{accountHandle}</span>
            </div>
          </div>

          {/* Actions List */}
          <div className="space-y-3">
            {actions.map((action) => {
              const config = actionTypeConfig[action.type]
              const Icon = config.icon
              
              return (
                <div key={action.id} className="space-y-2">
                  <div
                    className={cn(
                      "w-full bg-card rounded-lg p-3 flex items-center justify-between",
                      action.status === 'loading' && "opacity-80"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Icon className={cn("w-4 h-4 flex-shrink-0", config.className)} />
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className="font-medium">
                          {config.label} for ${action.payment.toFixed(2)}
                        </span>
                        <a 
                          href={action.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-primary hover:underline truncate w-full text-left"
                        >
                          {truncateUrl(action.url, platform)}
                        </a>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      {renderActionStatus(action.status)}
                    </div>
                  </div>
                  
                  {action.status === 'error' && action.errorMessage && (
                    <div className="pl-7 pr-3">
                      <p className="text-sm text-destructive">
                        {action.errorMessage}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Empty State */}
          {actions.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground text-center">
                No actions available at the moment
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Fixed footer with gradient background */}
      <div className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-gradient-to-t from-background via-background to-transparent pt-6 pb-6 px-4">
        <div className="bg-background">
          <Button 
            onClick={onStartActions}
            size="lg"
            className="w-full"
            disabled={actions.length === 0}
          >
            Start
          </Button>
        </div>
      </div>
    </div>
  )
}