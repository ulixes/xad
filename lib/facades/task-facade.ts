import { useState, useEffect, useCallback } from 'react'
import { useTaskAPI, ActiveTaskResponse, Task, PaginationMeta, SubmitTaskResponse } from '../api'

export interface TaskFacadeState {
  // Active task state
  activeTask: ActiveTaskResponse | null
  activeTaskLoading: boolean
  activeTaskError: string | null
  hasActiveTask: boolean
  
  // Available tasks state
  availableTasks: Task[]
  availableTasksLoading: boolean
  availableTasksError: string | null
  availableTasksPagination: PaginationMeta | null
  loadingMoreTasks: boolean
  
  // Claiming state
  claimingTaskId: string | null
  claimError: string | null
  
  // Submission state
  submittingTask: boolean
  submitError: string | null
}

export interface TaskActions {
  refreshActiveTask: () => Promise<void>
  refreshAvailableTasks: () => Promise<void>
  loadMoreTasks: () => Promise<void>
  claimTask: (taskId: string) => Promise<void>
  clearClaimError: () => void
  submitTask: (taskId: string, evidence: any) => Promise<void>
  clearSubmitError: () => void
}

// Task Facade Hook - abstracts task management
export const useTaskFacade = (): {
  state: TaskFacadeState
  actions: TaskActions
  computed: {
    hasActiveTask: boolean
    isLoadingActiveTask: boolean
    isLoadingAvailableTasks: boolean
    isLoadingMoreTasks: boolean
    isClaimingTask: boolean
    isSubmittingTask: boolean
  }
} => {
  const { getActiveTask, getTasks, claimTask, submitTask } = useTaskAPI()
  
  const [state, setState] = useState<TaskFacadeState>({
    activeTask: null,
    activeTaskLoading: false,
    activeTaskError: null,
    hasActiveTask: false,
    
    availableTasks: [],
    availableTasksLoading: false,
    availableTasksError: null,
    availableTasksPagination: null,
    loadingMoreTasks: false,
    
    claimingTaskId: null,
    claimError: null,
    
    submittingTask: false,
    submitError: null,
  })

  // Load active task from API
  const loadActiveTask = useCallback(async () => {
    setState(prev => ({ ...prev, activeTaskLoading: true, activeTaskError: null }))
    
    try {
      const activeTask = await getActiveTask()
      setState(prev => ({
        ...prev,
        activeTask,
        activeTaskLoading: false,
        hasActiveTask: !!activeTask,
        activeTaskError: null,
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        activeTask: null,
        activeTaskLoading: false,
        hasActiveTask: false,
        activeTaskError: error instanceof Error ? error.message : 'Failed to load active task',
      }))
    }
  }, [getActiveTask])

  // Load available tasks from API (first page)
  const loadAvailableTasks = useCallback(async () => {
    setState(prev => ({ ...prev, availableTasksLoading: true, availableTasksError: null }))
    
    try {
      const tasksResponse = await getTasks(1, 5) // First page with 5 items
      setState(prev => ({
        ...prev,
        availableTasks: tasksResponse.tasks,
        availableTasksPagination: tasksResponse.pagination,
        availableTasksLoading: false,
        availableTasksError: null,
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        availableTasks: [],
        availableTasksPagination: null,
        availableTasksLoading: false,
        availableTasksError: error instanceof Error ? error.message : 'Failed to load available tasks',
      }))
    }
  }, [getTasks])

  // Load more tasks (pagination)
  const loadMoreTasks = useCallback(async () => {
    if (!state.availableTasksPagination?.hasNext || state.loadingMoreTasks) {
      return
    }

    setState(prev => ({ ...prev, loadingMoreTasks: true }))
    
    try {
      const nextPage = state.availableTasksPagination.page + 1
      const tasksResponse = await getTasks(nextPage, 5)
      
      setState(prev => ({
        ...prev,
        availableTasks: [...prev.availableTasks, ...tasksResponse.tasks],
        availableTasksPagination: tasksResponse.pagination,
        loadingMoreTasks: false,
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        loadingMoreTasks: false,
        availableTasksError: error instanceof Error ? error.message : 'Failed to load more tasks',
      }))
    }
  }, [getTasks, state.availableTasksPagination, state.loadingMoreTasks])

  // Claim a task
  const handleClaimTask = useCallback(async (taskId: string) => {
    setState(prev => ({ ...prev, claimingTaskId: taskId, claimError: null }))
    
    try {
      await claimTask(taskId)
      
      // Refresh active task and available tasks after claiming
      await Promise.all([
        loadActiveTask(),
        loadAvailableTasks()
      ])
      
      setState(prev => ({ ...prev, claimingTaskId: null }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim task'
      setState(prev => ({
        ...prev,
        claimingTaskId: null,
        claimError: errorMessage,
      }))
      // Re-throw the error so the calling component can handle it
      throw error
    }
  }, [claimTask, loadActiveTask, loadAvailableTasks])

  // Clear claim error
  const clearClaimError = useCallback(() => {
    setState(prev => ({ ...prev, claimError: null }))
  }, [])

  // Submit a task
  const handleSubmitTask = useCallback(async (taskId: string, evidence: any) => {
    setState(prev => ({ ...prev, submittingTask: true, submitError: null }))
    
    try {
      await submitTask(taskId, evidence)
      
      // Refresh active task after submission
      await loadActiveTask()
      
      setState(prev => ({ ...prev, submittingTask: false }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit task'
      setState(prev => ({
        ...prev,
        submittingTask: false,
        submitError: errorMessage,
      }))
      // Re-throw the error so the calling component can handle it
      throw error
    }
  }, [submitTask, loadActiveTask])

  // Clear submit error
  const clearSubmitError = useCallback(() => {
    setState(prev => ({ ...prev, submitError: null }))
  }, [])

  // Load initial data on mount
  useEffect(() => {
    loadActiveTask()
    loadAvailableTasks()
  }, []) // Empty dependency array to run only once

  const actions: TaskActions = {
    refreshActiveTask: loadActiveTask,
    refreshAvailableTasks: loadAvailableTasks,
    loadMoreTasks: loadMoreTasks,
    claimTask: handleClaimTask,
    clearClaimError,
    submitTask: handleSubmitTask,
    clearSubmitError,
  }

  return {
    // Legacy state interface for backward compatibility
    state: {
      ...state,
      activeTask: state.activeTask,
      availableTasks: state.availableTasks,
      availableTasksPagination: state.availableTasksPagination,
      claimingTaskId: state.claimingTaskId,
      claimError: state.claimError,
      submittingTask: state.submittingTask,
      submitError: state.submitError
    },
    // Legacy actions interface
    actions: {
      ...actions,
      claimTask: actions.claimTask,
      submitTask: actions.submitTask,
      clearClaimError: actions.clearClaimError,
      clearSubmitError: actions.clearSubmitError
    },
    // Computed values
    computed: {
      hasActiveTask: state.hasActiveTask,
      isLoadingActiveTask: state.activeTaskLoading,
      isLoadingAvailableTasks: state.availableTasksLoading,
      isLoadingMoreTasks: state.loadingMoreTasks,
      isClaimingTask: !!state.claimingTaskId,
      isSubmittingTask: state.submittingTask
    },
    // Direct access for new components (excluding actions to avoid duplication)
    ...state,
  }
}