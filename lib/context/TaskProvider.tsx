import React, { createContext, useContext, ReactNode } from 'react'
import { useTaskFacade } from '../facades/task-facade'

type TaskFacade = ReturnType<typeof useTaskFacade>

const TaskReactContext = createContext<TaskFacade | null>(null)

export const useTask = () => {
  const context = useContext(TaskReactContext)
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider')
  }
  return context
}

interface TaskProviderProps {
  children: ReactNode
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const taskFacade = useTaskFacade()

  return (
    <TaskReactContext.Provider value={taskFacade}>
      {children}
    </TaskReactContext.Provider>
  )
}