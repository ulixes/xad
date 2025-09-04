import { createMachine, assign } from 'xstate'
import { useTaskAPI, ActiveTaskResponse, Task, PaginationMeta } from '../api'

export interface TaskContext {
  // Active task state
  activeTask: ActiveTaskResponse | null
  activeTaskError: string | null
  
  // Available tasks state
  availableTasks: Task[]
  availableTasksError: string | null
  availableTasksPagination: PaginationMeta | null
  
  // UI state
  claimingTaskId: string | null
  claimError: string | null
  submittingTask: boolean
  submitError: string | null
  loadingMoreTasks: boolean
}

export type TaskEvent = 
  | { type: 'LOAD_ACTIVE_TASK' }
  | { type: 'LOAD_AVAILABLE_TASKS'; page?: number; limit?: number }
  | { type: 'LOAD_MORE_TASKS' }
  | { type: 'CLAIM_TASK'; taskId: string }
  | { type: 'SUBMIT_TASK'; taskId: string; evidence: any }
  | { type: 'CLEAR_CLAIM_ERROR' }
  | { type: 'CLEAR_SUBMIT_ERROR' }
  | { type: 'ACTIVE_TASK_SUCCESS'; data: ActiveTaskResponse | null }
  | { type: 'ACTIVE_TASK_ERROR'; error: string }
  | { type: 'AVAILABLE_TASKS_SUCCESS'; data: { tasks: Task[]; pagination: PaginationMeta } }
  | { type: 'AVAILABLE_TASKS_ERROR'; error: string }
  | { type: 'MORE_TASKS_SUCCESS'; data: { tasks: Task[]; pagination: PaginationMeta } }
  | { type: 'MORE_TASKS_ERROR'; error: string }
  | { type: 'CLAIM_TASK_SUCCESS'; data: any }
  | { type: 'CLAIM_TASK_ERROR'; error: string }
  | { type: 'SUBMIT_TASK_SUCCESS'; data: any }
  | { type: 'SUBMIT_TASK_ERROR'; error: string }

export const taskMachine = createMachine<TaskContext, TaskEvent>({
  id: 'taskMachine',
  initial: 'idle',
  context: {
    activeTask: null,
    activeTaskError: null,
    availableTasks: [],
    availableTasksError: null,
    availableTasksPagination: null,
    claimingTaskId: null,
    claimError: null,
    submittingTask: false,
    submitError: null,
    loadingMoreTasks: false,
  },
  states: {
    idle: {
      on: {
        LOAD_ACTIVE_TASK: 'loadingActiveTask',
        LOAD_AVAILABLE_TASKS: 'loadingAvailableTasks',
        LOAD_MORE_TASKS: 'loadingMoreTasks',
        CLAIM_TASK: 'claimingTask',
        SUBMIT_TASK: 'submittingTask',
        CLEAR_CLAIM_ERROR: {
          actions: assign({ claimError: null })
        },
        CLEAR_SUBMIT_ERROR: {
          actions: assign({ submitError: null })
        }
      }
    },
    
    loadingActiveTask: {
      on: {
        ACTIVE_TASK_SUCCESS: {
          target: 'idle',
          actions: assign({
            activeTask: ({ event }) => event.data,
            activeTaskError: null
          })
        },
        ACTIVE_TASK_ERROR: {
          target: 'idle',
          actions: assign({
            activeTask: null,
            activeTaskError: ({ event }) => event.error
          })
        }
      }
    },
    
    loadingAvailableTasks: {
      on: {
        AVAILABLE_TASKS_SUCCESS: {
          target: 'idle',
          actions: assign({
            availableTasks: ({ event }) => event.data.tasks,
            availableTasksPagination: ({ event }) => event.data.pagination,
            availableTasksError: null
          })
        },
        AVAILABLE_TASKS_ERROR: {
          target: 'idle',
          actions: assign({
            availableTasks: [],
            availableTasksPagination: null,
            availableTasksError: ({ event }) => event.error
          })
        }
      }
    },
    
    loadingMoreTasks: {
      entry: assign({ loadingMoreTasks: true }),
      exit: assign({ loadingMoreTasks: false }),
      on: {
        MORE_TASKS_SUCCESS: {
          target: 'idle',
          actions: assign({
            availableTasks: ({ context, event }) => [...context.availableTasks, ...event.data.tasks],
            availableTasksPagination: ({ event }) => event.data.pagination,
            availableTasksError: null
          })
        },
        MORE_TASKS_ERROR: {
          target: 'idle',
          actions: assign({
            availableTasksError: ({ event }) => event.error
          })
        }
      }
    },
    
    claimingTask: {
      entry: assign({ claimingTaskId: ({ event }) => event.taskId, claimError: null }),
      exit: assign({ claimingTaskId: null }),
      on: {
        CLAIM_TASK_SUCCESS: {
          target: 'idle',
          actions: assign({ claimError: null })
        },
        CLAIM_TASK_ERROR: {
          target: 'idle',
          actions: assign({
            claimError: ({ event }) => event.error
          })
        }
      }
    },
    
    submittingTask: {
      entry: assign({ submittingTask: true, submitError: null }),
      exit: assign({ submittingTask: false }),
      on: {
        SUBMIT_TASK_SUCCESS: {
          target: 'idle',
          actions: assign({ submitError: null })
        },
        SUBMIT_TASK_ERROR: {
          target: 'idle',
          actions: assign({
            submitError: ({ event }) => event.error
          })
        }
      }
    }
  }
})