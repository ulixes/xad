import { useState, useEffect, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useUserAPI, UserResponse } from "../api";

export interface DashboardState {
  data: UserResponse | null;
  userData: UserResponse | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  hasRedditProfile: boolean;
  canCashOut: boolean;
  balance: number;
  cashOutLimit: number;
  progressPercentage: number;
}

export interface DashboardActions {
  refresh: () => Promise<void>;
}

// Dashboard Facade Hook - abstracts API and authentication details
export const useDashboardFacade = (): DashboardState & {
  actions: DashboardActions;
} => {
  const { authenticated } = usePrivy();
  const { getUser } = useUserAPI();

  const [state, setState] = useState<DashboardState>({
    data: null,
    userData: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    hasRedditProfile: false,
    canCashOut: false,
    balance: 0,
    cashOutLimit: 5,
    progressPercentage: 0,
  });

  // Load user data
  const loadUserData = useCallback(async () => {
    if (!authenticated) {
      setState((prev) => ({
        ...prev,
        data: null,
        userData: null,
        isAuthenticated: false,
        hasRedditProfile: false,
        canCashOut: false,
        balance: 0,
        progressPercentage: 0,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await getUser();
      const balance = data.user.balancePerStatus.approved || 0;
      const cashOutLimit = data.user.cashOutLimit || 0;
      const progressPercentage =
        cashOutLimit > 0 ? (balance / cashOutLimit) * 100 : 0;
      const canCashOut = balance >= cashOutLimit;

      setState({
        data,
        userData: data,
        loading: false,
        error: null,
        isAuthenticated: true,
        hasRedditProfile: !!data.user.redditUsername,
        canCashOut,
        balance,
        cashOutLimit,
        progressPercentage,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to load user data",
      }));
    }
  }, [authenticated, getUser]);

  // Initial load and authentication change effect
  useEffect(() => {
    loadUserData();
  }, [authenticated]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefreshEvent = () => {
      loadUserData();
    };

    window.addEventListener("dashboard-refresh-needed", handleRefreshEvent);

    return () => {
      window.removeEventListener(
        "dashboard-refresh-needed",
        handleRefreshEvent,
      );
    };
  }, [loadUserData]);

  const actions: DashboardActions = {
    refresh: loadUserData,
  };

  return {
    ...state,
    actions,
  };
};

// Utility functions for dashboard data
export const formatBalance = (balance: number): string => {
  return `$${balance}`;
};

export const formatProgress = (percentage: number): string => {
  return `${Math.round(percentage)}%`;
};

export const getProgressColor = (percentage: number): string => {
  if (percentage >= 100) return "success";
  if (percentage >= 75) return "warning";
  if (percentage >= 50) return "accent";
  return "primary";
};

export const getStatusMessage = (state: DashboardState): string => {
  if (!state.isAuthenticated) {
    return "Sign in to view your progress";
  }

  if (!state.hasRedditProfile) {
    return "Connect your Reddit profile to start earning";
  }

  if (state.canCashOut) {
    return "You can cash out now!";
  }

  const remaining = state.cashOutLimit - state.balance;
  return `${formatBalance(remaining)} until cash out`;
};
