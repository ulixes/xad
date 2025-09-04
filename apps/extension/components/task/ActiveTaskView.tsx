import React from 'react'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Target,
} from 'lucide-react'
import { NeoCard, NeoCardContent } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import type { ActiveTaskResponse } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'

export interface ActiveTaskViewProps {
  activeTask: ActiveTaskResponse | null
  loading: boolean
  error: string | null
  onRefresh: () => void
  onViewAvailableTasks: () => void
  onSubmitTask: () => void
}

export const ActiveTaskView: React.FC<ActiveTaskViewProps> = ({
  activeTask,
  loading,
  error,
  onRefresh,
  onViewAvailableTasks,
  onSubmitTask,
}) => {
  if (loading) {
    return (
      <NeoCard>
        <NeoCardContent className="text-center space-y-4">
          <div className="animate-spin mx-auto">
            <RefreshCw className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold uppercase">Loading Task</h3>
            <p className="text-sm text-muted-foreground">
              Checking for active tasks...
            </p>
          </div>
        </NeoCardContent>
      </NeoCard>
    )
  }

  if (error) {
    return (
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
    )
  }

  if (!activeTask) {
    return (
      <NeoCard>
        <NeoCardContent className="text-center space-y-4">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-bold uppercase">No Active Task</h3>
            <p className="text-sm text-muted-foreground">
              You don't have any active tasks right now
            </p>
          </div>
          <div className="flex gap-2">
            <NeoButton 
              onClick={onViewAvailableTasks} 
              variant="primary" 
              size="sm"
              fullWidth
            >
              View Available Tasks
            </NeoButton>
            <NeoButton onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-3 w-3" />
            </NeoButton>
          </div>
        </NeoCardContent>
      </NeoCard>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'primary'
      case 'in_progress': return 'accent'
      case 'completed': return 'success'
      case 'failed': return 'error'
      default: return 'primary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <Target className="h-4 w-4" />
      case 'in_progress': return <Clock className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'failed': return <AlertCircle className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-3">
      {/* Compact Header with Refresh */}
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-black uppercase tracking-wide">Active Task</h2>
        <NeoButton
          onClick={onRefresh}
          variant="outline"
          size="sm"
          icon={<RefreshCw className="h-3 w-3" />}
        >
        </NeoButton>
      </div>

      {/* Main Task Info - Compact Layout */}
      <div className={`border-2 ${
        activeTask.status === 'completed' ? 'border-green-500 bg-green-50' :
        activeTask.status === 'failed' ? 'border-red-500 bg-red-50' :
        activeTask.status === 'in_progress' ? 'border-blue-500 bg-blue-50' :
        'border-yellow-500 bg-yellow-50'
      } shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
        
        {/* Top row: Task type + Platform + Reward */}
        <div className="p-2 flex justify-between items-center">
          <div>
            <div className="text-xs font-black uppercase">
              {activeTask.task.type} @{activeTask.task.platform}
            </div>
            <div className="text-xs text-muted-foreground">
              Status: <span className="font-bold capitalize">{activeTask.status}</span>
            </div>
          </div>
          <div className="text-sm font-black text-primary">
            {formatCurrency(parseFloat(activeTask.rewardAmount))}
          </div>
        </div>

        {/* Instructions - Inline if present */}
        {activeTask.task.instructions.length > 0 && (
          <div className="px-2 pb-1 text-xs text-muted-foreground">
            {activeTask.task.instructions.join(' • ')}
          </div>
        )}

        {/* Target URL - Inline if present */}
        {activeTask.task.targets.length > 0 && (
          <div className="px-2 pb-1 text-xs font-mono text-muted-foreground truncate">
            {activeTask.task.targets[0]}
          </div>
        )}

        {/* Action Buttons - Full width, minimal padding */}
        <div className="p-2 pt-1 border-t border-border space-y-2">
          {/* Show Submit button for assigned tasks */}
          {activeTask.status === 'assigned' && (
            <NeoButton
              onClick={onSubmitTask}
              variant="accent"
              size="sm"
              fullWidth
              icon={<CheckCircle className="h-3 w-3" />}
            >
              Submit Task
            </NeoButton>
          )}
        </div>

        {/* Timestamp - Very small */}
        <div className="px-2 pb-2 text-xs text-muted-foreground">
          Created: {formatDate(activeTask.createdAt)}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="text-center">
        <NeoButton
          onClick={onViewAvailableTasks}
          variant="outline"
          size="sm"
          fullWidth
        >
          View Available Tasks
        </NeoButton>
      </div>
    </div>
  )
}