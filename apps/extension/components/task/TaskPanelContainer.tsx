import React, { useEffect } from 'react'
import { ActiveTaskView } from './ActiveTaskView'
import { useTask } from '@/lib/context/TaskProvider'

export const TaskPanelContainer: React.FC = () => {
  const { state, actions, computed } = useTask()

  // Load active task on mount
  useEffect(() => {
    actions.refreshActiveTask()
  }, [])


  const handleViewAvailableTasks = () => {
    // Trigger available tasks activation within the same side panel
    window.dispatchEvent(new CustomEvent('available-tasks-activation'))
  }

  const handleSubmitTask = () => {
    // Trigger task submission activation within the same side panel
    window.dispatchEvent(new CustomEvent('task-submission-activation'))
  }

  return (
    <ActiveTaskView
      activeTask={state.activeTask}
      loading={computed.isLoadingActiveTask}
      error={state.activeTaskError}
      onRefresh={actions.refreshActiveTask}
      onViewAvailableTasks={handleViewAvailableTasks}
      onSubmitTask={handleSubmitTask}
    />
  )
}