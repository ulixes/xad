import { usePrivy } from "@privy-io/react-auth";

const API_BASE_URL = "http://localhost:3001";

export type UserWallet = {
  address: string;
  type: string;
  verified: boolean;
};

export type UserResponse = {
  id: string;
  email: string | null;
  phone: string | null;
  wallets: UserWallet[];
  redditUsername: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Task-related interfaces
export interface TaskBrand {
  name: string;
}

export interface Task {
  task_id: string;
  brand?: string; // Keep for backward compatibility
  brand_name: string;
  platform: "reddit" | "twitter" | "facebook" | "instagram" | "linkedin";
  type: "comment" | "like" | "share" | "follow" | "post";
  targets: string[];
  volume: number;
  currency: string;
  reward_per_action: string;
  expiration_date: string;
  instructions: string[];
  created_at: string;
}

export interface ActiveTaskResponse {
  taskAssignmentId: string;
  taskId: string;
  status: "assigned" | "in_progress" | "completed" | "failed";
  rewardAmount: string;
  currency: string;
  createdAt: string;
  task: {
    platform: string;
    type: string;
    targets: string[];
    instructions: string[];
    brand: TaskBrand;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TasksListResponse {
  tasks: Task[];
  pagination: PaginationMeta;
}

export interface ClaimTaskResponse {
  taskAssignmentId: string;
  taskId: string;
  userId: string;
  status: "assigned";
  rewardAmount: string;
  currency: string;
  createdAt: string;
}

export interface SubmitTaskResponse {
  taskAssignmentId: string;
  taskId: string;
  userId: string;
  status: "submitted";
  evidence: any;
  submittedAt: string;
  rewardAmount: string;
  currency: string;
  payoutStatus: string;
}

// Cashout-related interfaces
export interface BalanceBreakdown {
  approved: number;
  submitted: number;
  awaiting: number;
  rejected: number;
  expired: number;
}

export interface AwaitingTask {
  taskId: string;
  amount: number;
  daysUntilApproval: number;
  approvalProgressPercentage: number;
}

export interface CashoutProgressResponse {
  userId: string;
  isActive: boolean;
  cashOutProgress: {
    approvedBalance: number;
    potentialBalance: number;
    cashOutLimit: number;
    progressPercentage: number;
    potentialProgressPercentage: number;
    isCashOutEligible: boolean;
    remainingToCashOut: number;
  };
  lastUpdated: string;
}

export function useAuthenticatedAPI() {
  const { getAccessToken } = usePrivy();

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const token = await getAccessToken();

      return fetch(`${API_BASE_URL}/api${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      throw error;
    }
  };

  return { apiCall };
}

export const useUserAPI = () => {
  const { apiCall } = useAuthenticatedAPI();
  const { user: privyUser } = usePrivy();

  const getUser = async (): Promise<UserResponse> => {
    if (!privyUser?.id) {
      throw new Error("User not authenticated");
    }

    const response = await apiCall(`/users/${privyUser.id}`);
    if (!response.ok) {
      throw new Error(`User API error: ${response.status}`);
    }
    return response.json();
  };

  return { getUser };
};

export const useTaskAPI = () => {
  const { apiCall } = useAuthenticatedAPI();
  const { user: privyUser } = usePrivy();

  // Get user's active task
  const getActiveTask = async (): Promise<ActiveTaskResponse | null> => {
    if (!privyUser?.id) {
      throw new Error("User not authenticated");
    }

    const response = await apiCall(`/users/${privyUser.id}/active-task`);

    if (response.status === 404) {
      return null; // No active task
    }

    if (!response.ok) {
      throw new Error(`Active task API error: ${response.status}`);
    }

    return response.json();
  };

  // Get list of claimable tasks for the user with pagination
  const getTasks = async (
    page: number = 1,
    limit: number = 5,
  ): Promise<TasksListResponse> => {
    if (!privyUser?.id) {
      throw new Error("User not authenticated");
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await apiCall(
      `/users/${privyUser.id}/claimable-tasks?${params}`,
    );

    if (!response.ok) {
      throw new Error(`Tasks API error: ${response.status}`);
    }

    return response.json();
  };

  // Claim a task
  const claimTask = async (taskId: string): Promise<ClaimTaskResponse> => {
    const response = await apiCall(`/tasks/${taskId}/claim`, {
      method: "POST",
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.error || `Claim task API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  };

  // Submit task with evidence
  const submitTask = async (
    taskId: string,
    evidence: any,
  ): Promise<SubmitTaskResponse> => {
    const response = await apiCall(`/tasks/${taskId}/submit`, {
      method: "POST",
      body: JSON.stringify({ evidence }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.error || `Submit task API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  };

  return { getActiveTask, getTasks, claimTask, submitTask };
};

export const useCashoutAPI = () => {
  const { apiCall } = useAuthenticatedAPI();
  const { user: privyUser } = usePrivy();

  const getCashoutProgress = async (): Promise<CashoutProgressResponse> => {
    if (!privyUser?.id) {
      throw new Error("User not authenticated");
    }

    const response = await apiCall(`/users/${privyUser.id}/cashout-progress`);
    if (!response.ok) {
      throw new Error(`Cashout progress API error: ${response.status}`);
    }
    return response.json();
  };

  const initiateCashout = async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    if (!privyUser?.id) {
      throw new Error("User not authenticated");
    }

    const response = await apiCall(`/users/${privyUser.id}/cashout`, {
      method: "POST",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Cashout API error: ${response.status}`,
      );
    }

    return response.json();
  };

  return { getCashoutProgress, initiateCashout };
};
