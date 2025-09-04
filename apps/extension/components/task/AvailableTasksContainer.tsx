import React, { useEffect } from 'react'
import { AvailableTasksView } from './AvailableTasksView'
import { useTask } from '@/lib/context/TaskProvider'

export interface AvailableTasksContainerProps {
  onBack: () => void
  onTaskClaimed: (task: any) => void
}

export const AvailableTasksContainer: React.FC<AvailableTasksContainerProps> = ({
  onBack,
  onTaskClaimed,
}) => {
  const { state, actions, computed } = useTask()

  // Load available tasks on mount
  useEffect(() => {
    actions.refreshAvailableTasks()
  }, [])

  const handleTaskClaimed = async (taskId: string) => {
    try {
      await actions.claimTask(taskId)
      // If we get here, the claim was successful
      onTaskClaimed({ taskId })
    } catch (error) {
      // If claim failed, stay on available tasks page 
      // The error is already handled by the context and will show in the UI
    }
  }

  return (
    <AvailableTasksView
      tasks={state.availableTasks}
      loading={computed.isLoadingAvailableTasks}
      error={state.availableTasksError}
      claimingTaskId={state.claimingTaskId}
      claimError={state.claimError}
      pagination={state.availableTasksPagination}
      loadingMoreTasks={computed.isLoadingMoreTasks}
      hasActiveTask={computed.hasActiveTask}
      onRefresh={actions.refreshAvailableTasks}
      onLoadMore={actions.loadMoreTasks}
      onClaimTask={handleTaskClaimed}
      onBack={onBack}
      onClearClaimError={actions.clearClaimError}
    />
  )
}