import React from "react";
import { CashoutProgressResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info } from "lucide-react";

interface CashoutProgressCardProps {
  data?: CashoutProgressResponse;
  loading?: boolean;
  error?: string | null;
  onCashout?: () => void;
}

/**
 * A visual progress bar showing approved and potential progress.
 * - Green part represents the approved balance percentage.
 * - Yellow part represents the potential additional balance from pending tasks.
 */
const ProgressBar = ({
  approved,
  potential,
}: {
  approved: number;
  potential: number;
}) => {
  const approvedPercent = Math.min(approved, 100);
  // The potential progress is stacked on top of the approved one.
  const potentialPercent = Math.min(approved + potential, 100);

  return (
    <div
      className="relative h-4 w-full rounded-full bg-gray-200 border border-gray-400"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={approved}
    >
      <div
        className="absolute h-full rounded-full bg-yellow-300 transition-all duration-500"
        style={{ width: `${potentialPercent}%` }}
        title={`Potential: ${potential.toFixed(2)}%`}
      />
      <div
        className="absolute h-full rounded-full bg-green-500 transition-all duration-500"
        style={{ width: `${approvedPercent}%` }}
        title={`Approved: ${approved.toFixed(2)}%`}
      />
    </div>
  );
};

export const CashoutProgressCard: React.FC<CashoutProgressCardProps> = ({
  data,
  loading = false,
  error = null,
  onCashout,
}) => {
  if (loading) {
    return (
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader>
          <CardTitle>Loading Progress...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 w-full rounded-full bg-gray-200 animate-pulse" />
          <div className="h-8 w-24 mx-auto rounded-md bg-gray-200 animate-pulse" />
          <div className="h-4 w-32 mx-auto rounded-md bg-gray-200 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-sm mx-auto border-red-500 bg-red-50">
        <CardHeader className="flex flex-row items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <CardTitle className="text-red-500">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Info className="h-5 w-5 text-gray-500" />
          <CardTitle>No Cashout Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p>We can't find any cashout progress for you right now.</p>
        </CardContent>
      </Card>
    );
  }

  const {
    approvedBalance,
    potentialBalance,
    remainingToCashOut,
    cashOutLimit,
    progressPercentage,
    potentialProgressPercentage,
    isCashOutEligible: canCashout,
  } = data.cashOutProgress;

  return (
    <Card className="w-full max-w-sm mx-auto shadow-lg rounded-xl border-2 border-gray-900 bg-white">
      <CardHeader className="text-center pt-6">
        <CardTitle className="text-xl font-bold text-gray-700">
          Your Goal: <span className="text-green-600">${cashOutLimit}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ProgressBar
          approved={progressPercentage}
          potential={potentialProgressPercentage}
        />
        <div className="mt-2 flex justify-between text-xs text-gray-500 font-mono">
          <span>$0</span>
          <span>${cashOutLimit}</span>
        </div>

        <div className="mt-6 text-center">
          <p className="text-5xl font-bold tracking-tighter text-gray-800">
            ${approvedBalance.toFixed(2)}
          </p>
          <p className="text-sm font-medium text-gray-500 -mt-1">
            Approved Balance
          </p>
        </div>

        {potentialBalance > 0 && (
          <div className="mt-4 text-center p-2 bg-yellow-100 rounded-lg border border-yellow-300">
            <p className="text-lg font-semibold text-yellow-800">
              + ${potentialBalance.toFixed(2)} pending approval
            </p>
            <p className="text-xs text-yellow-700">Keep completing tasks!</p>
          </div>
        )}

        <div className="mt-6 text-center">
          {canCashout ? (
            <div className="p-4 bg-green-100 rounded-lg border border-green-300">
              <p className="text-lg font-semibold text-green-800">
                Congratulations! You've hit your goal!
              </p>
              {onCashout && (
                <Button
                  onClick={onCashout}
                  className="mt-4 w-full font-bold"
                  size="lg"
                >
                  Cash Out ${approvedBalance.toFixed(2)}
                </Button>
              )}
            </div>
          ) : (
            <p className="text-md font-medium text-gray-700">
              You're almost there! Just{" "}
              <span className="font-bold text-green-600">
                ${remainingToCashOut.toFixed(2)}
              </span>{" "}
              to go.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
