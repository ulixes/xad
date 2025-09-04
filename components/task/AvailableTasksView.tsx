import React from 'react'
import { 
  Clock, 
  DollarSign, 
  Users, 
  Target, 
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Loader2,
  Calendar
} from 'lucide-react'
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import type { Task, PaginationMeta } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'

export interface AvailableTasksViewProps {
  tasks: Task[]
  loading: boolean
  error: string | null
  claimingTaskId: string | null
  claimError: string | null
  pagination: PaginationMeta | null
  loadingMoreTasks: boolean
  hasActiveTask: boolean
  onRefresh: () => Promise<void>
  onLoadMore: () => Promise<void>
  onClaimTask: (taskId: string) => void
  onBack: () => void
  onClearClaimError: () => void
}

export const AvailableTasksView: React.FC<AvailableTasksViewProps> = ({
  tasks,
  loading,
  error,
  claimingTaskId,
  claimError,
  pagination,
  loadingMoreTasks,
  hasActiveTask,
  onRefresh,
  onLoadMore,
  onClaimTask,
  onBack,
  onClearClaimError,
}) => {
  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'reddit': return 'text-orange-600'
      case 'twitter': return 'text-blue-600'
      case 'facebook': return 'text-blue-700'
      case 'instagram': return 'text-pink-600'
      case 'linkedin': return 'text-blue-800'
      default: return 'text-gray-600'
    }
  }

  const getTimeRemaining = (expirationDate: string) => {
    const now = new Date()
    const expiry = new Date(expirationDate)
    const diff = expiry.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h`
    
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${minutes}m`
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <NeoButton 
            onClick={onBack}
            variant="outline" 
            size="sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </NeoButton>
          <h1 className="text-lg font-black uppercase tracking-wide">
            Available Tasks
          </h1>
        </div>

        {/* Loading */}
        <NeoCard>
          <NeoCardContent className="text-center space-y-4">
            <div className="animate-spin mx-auto">
              <RefreshCw className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold uppercase">Loading Tasks</h3>
              <p className="text-sm text-muted-foreground">
                Finding available tasks for you...
              </p>
            </div>
          </NeoCardContent>
        </NeoCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <NeoButton 
          onClick={onBack}
          variant="outline" 
          size="sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </NeoButton>
        <h1 className="text-lg font-black uppercase tracking-wide">
          Available Tasks
        </h1>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <NeoButton
          onClick={onRefresh}
          variant="outline"
          size="sm"
          loading={loading}
          icon={!loading ? <RefreshCw className="h-3 w-3" /> : undefined}
          fullWidth
        >
          {loading ? 'Loading...' : 'Refresh Tasks'}
        </NeoButton>
      </div>

      {/* Active Task Notice */}
      {hasActiveTask && (
        <div className="border-2 border-yellow-500 bg-yellow-50 p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <div className="text-sm">
              <span className="font-bold text-yellow-700">Active Task in Progress</span>
              <div className="text-xs text-yellow-600">
                Finish your current task before claiming new ones
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claim Error */}
      {claimError && (
        <NeoCard variant="error">
          <NeoCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">{claimError}</span>
              </div>
              <NeoButton onClick={onClearClaimError} variant="outline" size="sm">
                Dismiss
              </NeoButton>
            </div>
          </NeoCardContent>
        </NeoCard>
      )}

      {/* Error State */}
      {error && (
        <NeoCard variant="error">
          <NeoCardContent className="text-center space-y-4">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold uppercase text-red-700">Error</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <NeoButton onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-3 w-3" />
              Retry
            </NeoButton>
          </NeoCardContent>
        </NeoCard>
      )}

      {/* No Tasks */}
      {!loading && !error && tasks.length === 0 && (
        <NeoCard>
          <NeoCardContent className="text-center space-y-4">
            <Target className="h-8 w-8 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold uppercase">No Tasks Available</h3>
              <p className="text-sm text-muted-foreground">
                There are no tasks available right now. Check back later!
              </p>
            </div>
            <NeoButton onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-3 w-3" />
              Check Again
            </NeoButton>
          </NeoCardContent>
        </NeoCard>
      )}

      {/* Tasks List */}
      <div className="space-y-2">
        {tasks.map((task) => {
          const isExpired = new Date(task.expiration_date) <= new Date()
          const isClaiming = claimingTaskId === task.task_id
          
          return (
            <div 
              key={task.task_id} 
              className={`border-2 ${
                isExpired ? 'border-red-500 bg-red-50' : 'border-black bg-background'
              } shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
            >
              {/* Main Task Info - Compact single row */}
              <div className="p-2 flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-xs font-black uppercase">
                    {task.type} @{task.platform === 'twitter' ? 'X' : task.platform}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {task.volume} spots • {isExpired ? 'EXPIRED' : getTimeRemaining(task.expiration_date)} left
                  </div>
                </div>
                <div className="text-sm font-black text-primary">
                  {formatCurrency(parseFloat(task.reward_per_action))}
                </div>
              </div>

              {/* Instructions - Inline if present */}
              {task.instructions.length > 0 && (
                <div className="px-2 pb-1 text-xs text-muted-foreground">
                  {task.instructions.join(' • ')}
                </div>
              )}

              {/* Target URL - Inline if present */}
              {task.targets.length > 0 && (
                <div className="px-2 pb-1 text-xs font-mono text-muted-foreground truncate">
                  {task.targets[0]}
                </div>
              )}

              {/* Claim Button - Full width, minimal padding */}
              <div className="p-2 pt-1 border-t border-border">
                <NeoButton
                  onClick={() => onClaimTask(task.task_id)}
                  disabled={isExpired || isClaiming || hasActiveTask}
                  loading={isClaiming}
                  variant={isExpired || hasActiveTask ? 'outline' : 'primary'}
                  size="sm"
                  fullWidth
                >
                  {isExpired ? 'Expired' :
                   hasActiveTask ? 'Finish Current Task First' :
                   isClaiming ? 'Claiming...' :
                   `Claim ${formatCurrency(parseFloat(task.reward_per_action))}`}
                </NeoButton>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination Info & Load More */}
      {pagination && (
        <div className="space-y-3 pt-2">
          {/* Pagination Stats */}
          <div className="text-center text-xs text-muted-foreground">
            Showing {tasks.length} of {pagination.total} tasks
            {pagination.totalPages > 1 && ` • Page ${pagination.page} of ${pagination.totalPages}`}
          </div>

          {/* Load More Button */}
          {pagination.hasNext && (
            <NeoButton
              onClick={onLoadMore}
              variant="outline"
              size="sm"
              loading={loadingMoreTasks}
              icon={loadingMoreTasks ? <Loader2 className="h-3 w-3" /> : <RefreshCw className="h-3 w-3" />}
              fullWidth
            >
              {loadingMoreTasks ? 'Loading More...' : 'Load More Tasks'}
            </NeoButton>
          )}
        </div>
      )}
    </div>
  )
}