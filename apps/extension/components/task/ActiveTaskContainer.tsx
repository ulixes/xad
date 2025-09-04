import React from 'react'
import { ActiveTaskView } from './ActiveTaskView'
import { useTaskFacade } from '@/lib/facades/task-facade'

export interface ActiveTaskContainerProps {
  onViewAvailableTasks: () => void
  onSubmitTask: () => void
}

export const ActiveTaskContainer: React.FC<ActiveTaskContainerProps> = ({
  onViewAvailableTasks,
  onSubmitTask,
}) => {
  const taskFacade = useTaskFacade()

  const handleRefresh = () => {
    taskFacade.actions.refreshActiveTask()
  }

  return (
    <ActiveTaskView
      activeTask={taskFacade.activeTask}
      loading={taskFacade.activeTaskLoading}
      error={taskFacade.activeTaskError}
      onRefresh={handleRefresh}
      onViewAvailableTasks={onViewAvailableTasks}
      onSubmitTask={onSubmitTask}
    />
  )
}