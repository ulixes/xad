import React, { useState, useEffect } from "react";
import { TaskPanelContainer } from "@/components/task/TaskPanelContainer";
import { AuthContainer } from "@/components/auth";
import { AvailableTasksContainer } from "@/components/task/AvailableTasksContainer";
import { TaskSubmissionContainer } from "@/components/task/TaskSubmissionContainer";
import { usePrivy } from "@privy-io/react-auth";
import { Separator } from "@/components/ui/separator";
import { useUserAPI, UserResponse } from "@/lib/api";
import { CashoutProgressContainer } from "@/components/cashout";

export const SidePanelContent: React.FC = () => {
  const [showAvailableTasks, setShowAvailableTasks] = useState(false);
  const [showTaskSubmission, setShowTaskSubmission] = useState(false);
  const { authenticated } = usePrivy();

  // Handle available tasks activation trigger
  useEffect(() => {
    const handleAvailableTasksActivation = () => {
      setShowAvailableTasks(true);
    };

    const handleTaskSubmissionActivation = () => {
      setShowTaskSubmission(true);
    };

    window.addEventListener(
      "available-tasks-activation",
      handleAvailableTasksActivation,
    );
    window.addEventListener(
      "task-submission-activation",
      handleTaskSubmissionActivation,
    );

    return () => {
      window.removeEventListener(
        "available-tasks-activation",
        handleAvailableTasksActivation,
      );
      window.removeEventListener(
        "task-submission-activation",
        handleTaskSubmissionActivation,
      );
    };
  }, []);

  const handleBackFromAvailableTasks = () => {
    setShowAvailableTasks(false);
  };

  const handleTaskClaimed = (task: any) => {
    setShowAvailableTasks(false);
    // Refresh user data to show new active task
    window.dispatchEvent(new CustomEvent("dashboard-refresh-needed"));
  };

  const handleBackFromTaskSubmission = () => {
    setShowTaskSubmission(false);
  };

  const handleTaskSubmitted = () => {
    setShowTaskSubmission(false);
    // Refresh user data after task submission
    window.dispatchEvent(new CustomEvent("dashboard-refresh-needed"));
  };

  // Show Available Tasks panel if triggered
  if (showAvailableTasks) {
    return (
      <AvailableTasksContainer
        onBack={handleBackFromAvailableTasks}
        onTaskClaimed={handleTaskClaimed}
      />
    );
  }

  // Show Task Submission panel if triggered
  if (showTaskSubmission) {
    return (
      <TaskSubmissionContainer
        onBack={handleBackFromTaskSubmission}
        onTaskSubmitted={handleTaskSubmitted}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      {/* Always show Auth at the top for session management */}
      <AuthContainer />

      {/* Show progress card and TaskPanel if authenticated */}
      {authenticated && (
        <>
          <Separator className="border-2 border-border" />

          {/* Cashout Progress Card */}
          <CashoutProgressContainer />

          <Separator className="border-2 border-border" />

          {/* Task Panel */}
          <TaskPanelContainer />
        </>
      )}
    </div>
  );
};
