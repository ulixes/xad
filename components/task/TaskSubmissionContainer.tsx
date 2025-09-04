import React, { useState } from 'react';
import { useTask } from '@/lib/context/TaskProvider';
import { Proof } from './Proof';
import { useTaskAPI } from '@/lib/api';
import { LikesResponse, TaskEvidence } from '@/src/types';
import { buildTaskEvidence } from '@/lib/utils/evidence-builder';

export interface TaskSubmissionContainerProps {
  onBack: () => void;
  onTaskSubmitted: () => void;
}

export const TaskSubmissionContainer: React.FC<TaskSubmissionContainerProps> = ({
  onBack,
  onTaskSubmitted,
}) => {
  const { state } = useTask();
  const { submitTask } = useTaskAPI();
  const [currentStep, setCurrentStep] = useState<'guidelines' | 'proof'>('guidelines');
  const [proof, setProof] = useState<LikesResponse | null>(null);
  const [taskEvidence, setTaskEvidence] = useState<TaskEvidence | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handle proof generation
  const handleProofGenerated = (generatedProof: LikesResponse) => {
    setProof(generatedProof);
    
    // Build proper evidence object with task validation
    if (state.activeTask) {
      const evidence = buildTaskEvidence(generatedProof, state.activeTask.task.targets);
      setTaskEvidence(evidence);
      
      // Set error if validation failed
      if (!evidence.isValid) {
        setSubmitError(
          `Validation failed: ${evidence.summary.foundInLikes}/${evidence.summary.totalTargets} target tweets found in your likes. ` +
          `Missing: ${evidence.summary.missingFromLikes.join(', ')}`
        );
      } else {
        setSubmitError(null); // Clear any previous errors
      }
    } else {
      setSubmitError('No active task found');
    }
  };

  // Handle task submission
  const handleSubmitTask = async () => {
    if (!state.activeTask || !taskEvidence) {
      return;
    }

    // Prevent submission if validation failed
    if (!taskEvidence.isValid) {
      setSubmitError('Cannot submit: Not all target tweets were found in your likes');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Submit the properly structured evidence instead of raw proof
      await submitTask(state.activeTask.taskId, taskEvidence);
      onTaskSubmitted();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle case where there is no active task
  if (!state.activeTask) {
    return (
      <div className="task-submission-container p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p className="mb-4">No active task selected. Please go back and select a task.</p>
        <button onClick={onBack} className="button-secondary px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-100">
          Go Back
        </button>
      </div>
    );
  }

  // Guidelines View
  if (currentStep === 'guidelines') {
    return (
      <div className="task-submission-container p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Submission Guidelines</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-semibold">Step 1 of 2:</span>
            <span>Review Guidelines</span>
          </div>
        </div>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <p className="text-sm font-medium text-blue-800 mb-1">Selected Task</p>
          <p className="font-semibold text-blue-900">Task ID: {state.activeTask.taskId}</p>
        </div>

        <div className="space-y-6 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              How It Works
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-700 ml-8">
              <li>Generate proof of completion in the next step</li>
              <li>Our team will manually review your submission for validity</li>
              <li>Once approved, payment will be deposited to your account after 7 days</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-2xl">💰</span>
              Payout Information
            </h3>
            <p className="text-gray-700 ml-8">
              Payments are processed weekly after a 7-day review period. For complete details about our payment process, please read our{' '}
              <a href="/payout-policy" className="text-blue-600 hover:underline font-medium">
                Payout Policy
              </a>.
            </p>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 p-4" role="alert">
            <div className="flex items-start gap-2">
              <span className="text-2xl flex-shrink-0">⚠️</span>
              <div>
                <p className="font-bold text-red-800 mb-1">Important Notice</p>
                <p className="text-red-700">
                  Any fraudulent submissions or abuse of our platform will result in a permanent account ban. 
                  We value a fair and respectful community; please adhere to our rules and policies.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <button 
            onClick={onBack} 
            className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-100 transition-colors"
          >
            ← Back
          </button>
          <button 
            onClick={() => setCurrentStep('proof')} 
            className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            I Understand, Continue →
          </button>
        </div>
      </div>
    );
  }

  // Proof Submission View
  return (
    <div className="task-submission-container p-6 bg-white rounded-lg shadow-md max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Submit Proof of Completion</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-semibold">Step 2 of 2:</span>
          <span>Submit Proof</span>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Submitting proof for:</p>
            <p className="font-semibold">Task ID: {state.activeTask.taskId}</p>
          </div>
          <button 
            onClick={() => setCurrentStep('guidelines')}
            className="text-sm text-blue-600 hover:underline"
          >
            Review Guidelines
          </button>
        </div>
      </div>

      <div className="mb-6">
        <Proof onProofGenerated={handleProofGenerated} />
      </div>

      {/* Error message */}
      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {submitError}
        </div>
      )}

      {/* Success message when proof is generated and validated */}
      {taskEvidence && taskEvidence.isValid && !submitError && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          ✓ Proof validated successfully! Found {taskEvidence.summary.foundInLikes}/{taskEvidence.summary.totalTargets} target tweets in your likes. You can now submit for review.
        </div>
      )}
      
      {/* Warning when validation has issues */}
      {taskEvidence && !taskEvidence.isValid && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
          ⚠️ Validation incomplete: Only {taskEvidence.summary.foundInLikes}/{taskEvidence.summary.totalTargets} target tweets found in your likes.
          {taskEvidence.summary.missingFromLikes.length > 0 && (
            <div className="mt-1 text-xs">
              Missing tweet IDs: {taskEvidence.summary.missingFromLikes.join(', ')}
            </div>
          )}
        </div>
      )}
      
      <div className="flex items-center justify-between pt-4 border-t">
        <button 
          onClick={() => setCurrentStep('guidelines')} 
          className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-100 transition-colors"
          disabled={isSubmitting}
        >
          ← Previous
        </button>
        <button 
          onClick={handleSubmitTask} 
          disabled={!taskEvidence || !taskEvidence.isValid || isSubmitting}
          className={`px-6 py-2 rounded-md font-semibold transition-colors ${
            !taskEvidence || !taskEvidence.isValid || isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Review'}
        </button>
      </div>
    </div>
  );
};