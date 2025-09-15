import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Clock, Loader2 } from 'lucide-react'

export interface CampaignAction {
  id: string
  actionType: 'like' | 'comment' | 'retweet' | 'share' | 'upvote' | 'save' | 'follow'
  target: string
  pricePerAction: number
  maxVolume: number
  currentVolume: number
  isActive: boolean
}

export interface Campaign {
  id: string
  platform: 'tiktok' | 'instagram' | 'x' | 'reddit'
  totalBudget: number
  remainingBudget: number
  status: 'draft' | 'pending_payment' | 'active' | 'paused' | 'completed' | 'cancelled'
  isActive: boolean
  createdAt: string
  updatedAt: string
  actions?: CampaignAction[]
}

export interface BrandDashboardProps {
  campaigns: Campaign[]
  isLoading?: boolean
  walletAddress?: string
  onCreateCampaign?: () => void
  onRefresh?: () => void
  className?: string
}

export function BrandDashboard({
  campaigns,
  isLoading = false,
  walletAddress,
  onCreateCampaign,
  onRefresh,
  className
}: BrandDashboardProps) {

  const formatBudget = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'completed': return 'bg-blue-500'
      case 'paused': return 'bg-yellow-500'
      case 'cancelled': return 'bg-red-500'
      case 'draft': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }


  const activeCampaigns = campaigns.filter(c => c.status === 'active')
  const completedCampaigns = campaigns.filter(c => c.status === 'completed')
  const totalBudget = campaigns.reduce((sum, c) => sum + c.totalBudget, 0)
  const totalRemaining = campaigns.reduce((sum, c) => sum + c.remainingBudget, 0)


  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brand Dashboard</h1>
          <p className="text-muted-foreground">Manage your advertising campaigns</p>
        </div>
        <div className="flex gap-2">
          {onRefresh && (
            <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </Button>
          )}
          {onCreateCampaign && (
            <Button onClick={onCreateCampaign}>
              Create New Campaign
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards - Equal sized, full width */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold">{formatBudget(totalBudget)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-2xl font-bold">{formatBudget(totalRemaining)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Active Campaigns</p>
              <p className="text-2xl font-bold">{activeCampaigns.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{completedCampaigns.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-muted-foreground">Loading campaigns...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaigns Tabs */}
      {!isLoading && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="all">All ({campaigns.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeCampaigns.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedCampaigns.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {campaigns.length === 0 ? (
              <EmptyState 
                message="No campaigns yet"
                actionMessage="Create Your First Campaign"
                onCreateCampaign={onCreateCampaign}
              />
            ) : (
              campaigns.map(campaign => (
                <CampaignCard 
                  key={campaign.id} 
                  campaign={campaign}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeCampaigns.length === 0 ? (
              <EmptyState 
                message="No active campaigns"
                onCreateCampaign={onCreateCampaign}
              />
            ) : (
              activeCampaigns.map(campaign => (
                <CampaignCard 
                  key={campaign.id} 
                  campaign={campaign}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedCampaigns.length === 0 ? (
              <EmptyState 
                message="No completed campaigns"
                onCreateCampaign={onCreateCampaign}
              />
            ) : (
              completedCampaigns.map(campaign => (
                <CampaignCard 
                  key={campaign.id} 
                  campaign={campaign}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

// Empty State Component
function EmptyState({ 
  message, 
  actionMessage = "Create Campaign",
  onCreateCampaign 
}: { 
  message: string
  actionMessage?: string
  onCreateCampaign?: () => void 
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          {onCreateCampaign && (
            <Button onClick={onCreateCampaign}>{actionMessage}</Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Campaign Card Component
function CampaignCard({ 
  campaign
}: { 
  campaign: Campaign
}) {
  const formatBudget = (cents: number) => `$${(cents / 100).toFixed(2)}`
  
  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'completed': return 'bg-blue-500/10 text-blue-700 border-blue-200'
      case 'paused': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200'
      case 'cancelled': return 'bg-red-500/10 text-red-700 border-red-200'
      case 'draft': return 'bg-gray-500/10 text-gray-700 border-gray-200'
      case 'pending_payment': return 'bg-orange-500/10 text-orange-700 border-orange-200'
      default: return 'bg-gray-400/10 text-gray-600 border-gray-200'
    }
  }

  const truncateUrl = (url: string) => {
    // Remove protocol
    let displayUrl = url.replace(/^https?:\/\//, '')
    // Remove www
    displayUrl = displayUrl.replace(/^www\./, '')
    // Truncate if too long
    if (displayUrl.length > 50) {
      return displayUrl.substring(0, 47) + '...'
    }
    return displayUrl
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            Campaign #{campaign.id.slice(0, 8)}
            {campaign.status !== 'active' && (
              <Badge className={getStatusColor(campaign.status)}>
                {campaign.status.replace('_', ' ')}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            Created {new Date(campaign.createdAt).toLocaleDateString()}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="text-lg font-semibold">{formatBudget(campaign.totalBudget)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="text-lg font-semibold text-green-600">
              {formatBudget(campaign.remainingBudget)}
            </p>
          </div>
        </div>

        {/* Actions with Individual Progress */}
        {campaign.actions && campaign.actions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Campaign Actions</p>
            <div className="space-y-2">
              {campaign.actions.map(action => {
                const actionProgress = action.maxVolume > 0 
                  ? (action.currentVolume / action.maxVolume) * 100 
                  : 0
                
                return (
                  <div key={action.id} className="space-y-1">
                    <a
                      href={action.target.startsWith('http') ? action.target : `https://${campaign.platform}.com/${action.target}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start justify-between p-3 rounded-md bg-secondary/50 hover:bg-secondary transition-colors group"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {action.actionType}
                            </Badge>
                            <span className="text-sm text-primary group-hover:underline">
                              {truncateUrl(action.target)}
                            </span>
                          </div>
                          <svg 
                            className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                            />
                          </svg>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              ${(action.pricePerAction / 100).toFixed(2)} per action
                            </span>
                            <span className="font-medium">
                              {action.currentVolume} / {action.maxVolume}
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                                actionProgress === 100 ? 'bg-green-500' : 'bg-primary'
                              }`}
                              style={{ width: `${actionProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  )
}