import React, { useState, useEffect, useCallback } from "react";
import { CashoutProgressCard } from "./CashoutProgressCard";
import { useCashoutAPI, CashoutProgressResponse } from "@/lib/api";
import { usePrivy } from "@privy-io/react-auth";

export const CashoutProgressContainer: React.FC = () => {
  const [data, setData] = useState<CashoutProgressResponse | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { getCashoutProgress, initiateCashout } = useCashoutAPI();
  const { authenticated } = usePrivy();

  const loadCashoutData = useCallback(async () => {
    if (!authenticated) {
      setData(undefined);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const progressData = await getCashoutProgress();
      setData(progressData);
    } catch (err) {
      console.error("Failed to load cashout progress:", err);
      setError(err instanceof Error ? err.message : "Failed to load cashout progress");
      setData(undefined);
    } finally {
      setLoading(false);
    }
  }, [authenticated]);

  const handleCashout = useCallback(async () => {
    if (!data?.cashOutProgress.isCashOutEligible) return;

    setLoading(true);
    try {
      const result = await initiateCashout();
      
      if (result.success) {
        // Show success message (you might want to use a toast notification)
        alert(`Cashout successful! ${result.message}`);
        
        // Refresh the data
        await loadCashoutData();
        
        // Dispatch refresh event for other components
        window.dispatchEvent(new CustomEvent("dashboard-refresh-needed"));
      }
    } catch (err) {
      console.error("Cashout failed:", err);
      alert(`Cashout failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [data, initiateCashout]);

  // Load data on mount and when authentication changes
  useEffect(() => {
    loadCashoutData();
  }, [authenticated]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefreshEvent = () => {
      loadCashoutData();
    };

    window.addEventListener("dashboard-refresh-needed", handleRefreshEvent);
    return () => {
      window.removeEventListener("dashboard-refresh-needed", handleRefreshEvent);
    };
  }, []);

  if (!authenticated) {
    return null;
  }

  return (
    <CashoutProgressCard
      data={data}
      loading={loading}
      error={error}
      onCashout={handleCashout}
    />
  );
};