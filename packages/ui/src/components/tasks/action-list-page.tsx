import { cn } from "@/lib/utils"
import { Check, Loader2, X, Heart, MessageCircle, Repeat2, Share2, ArrowUp, Bookmark, UserRoundPlus, ChevronLeft } from "lucide-react"

export type ActionStatus = 'pending' | 'loading' | 'completed' | 'error'

export interface Action {
  id: string
  type: 'like' | 'comment' | 'retweet' | 'share' | 'upvote' | 'save' | 'follow'
  status: ActionStatus
  url: string
  payment: number
  errorMessage?: string
  platform: 'tiktok' | 'instagram' | 'x' | 'reddit'
  commentContent?: string // For comment actions, the emojis or text to post
}

interface ActionListPageProps {
  accountHandle: string
  platform: 'tiktok' | 'instagram' | 'x' | 'reddit'
  actions: Action[]
  availableActionsCount: number
  isLoading?: boolean
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
  isLoading = false,
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

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading available actions...</p>
            </div>
          )}

          {/* Actions List */}
          {!isLoading && (
            <div className="space-y-3">
              {actions.map((action) => {
              const config = actionTypeConfig[action.type]
              const Icon = config.icon
              
              return (
                <div key={action.id} className="space-y-2">
                  <div
                    className={cn(
                      "w-full bg-card rounded-lg p-3 flex items-center justify-between transition-all",
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
                          onClick={(e) => {
                            e.preventDefault();
                            onActionClick?.(action.id);
                          }}
                          className="text-sm text-primary hover:underline truncate w-full text-left cursor-pointer"
                        >
                          {truncateUrl(action.url, platform)}
                        </a>
                        {action.type === 'comment' && action.commentContent && (
                          <span className="text-sm text-muted-foreground">
                            Comment: {action.commentContent}
                          </span>
                        )}
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
          )}

          {/* Empty State */}
          {!isLoading && actions.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground text-center">
                No actions available at the moment
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}