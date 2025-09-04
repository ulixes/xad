import React, { useState, useEffect } from 'react';
import { useTask } from '@/lib/context/TaskProvider';
import { LikesResponse, NormalizedUser } from '@/src/types';

export interface ProofProps {
  onProofGenerated?: (proof: LikesResponse) => void;
}

export const Proof: React.FC<ProofProps> = ({ onProofGenerated }) => {
  const { state } = useTask();
  const [likesViewConfirmed, setLikesViewConfirmed] = useState(false);
  const [likerProfile, setLikerProfile] = useState<NormalizedUser>();
  const [proof, setProof] = useState<LikesResponse>();

  // --- NO CHANGES TO STATE OR LOGIC ---
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === "user-opened-likes-view") {
        setLikesViewConfirmed(true);
      }
      if (message.type === "user-opened-x-profile") {
        setLikerProfile(message.user);
      }
      if (message.type === "proof") {
        setProof(message.proof);
        // Notify parent component when proof is generated
        if (onProofGenerated) {
          onProofGenerated(message.proof);
        }
      }
    };

    browser.runtime.onMessage.addListener(handleMessage);

    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, [onProofGenerated]);
  // --- END NO CHANGES ---

  return (
    <div className="border-t border-b border-gray-200 py-6 my-6">
      <h3 className="text-lg font-semibold mb-3">Proof Generation Steps</h3>
      <p className="text-sm text-gray-600 mb-4">
        Please follow the steps below precisely. Our browser extension will automatically detect your actions and confirm each step.
      </p>

      <ol className="space-y-4">
        {/* Step 1: Assumption */}
        <li className="flex items-start text-gray-900">
          <span className="font-bold mr-2">1.</span>
          <div>
            Confirm you have already liked the target tweet. This process is only for generating proof of that existing like.
          </div>
        </li>

        {/* Step 2: Visit Profile */}
        <li className={`flex items-start ${likerProfile ? 'text-gray-900' : 'text-gray-500'}`}>
          <span className="font-bold mr-2">2.</span>
          <div>
            Go to your profile page on X.com (e.g., `x.com/your_username`).
            {likerProfile && (
              <div className="mt-1 text-sm text-green-700">
                ✓ Profile Detected: <strong>@{likerProfile.handle}</strong>
              </div>
            )}
          </div>
        </li>

        {/* Step 3: Visit Likes Tab */}
        <li className={`flex items-start ${!likerProfile ? 'opacity-50' : ''} ${likesViewConfirmed ? 'text-gray-900' : 'text-gray-500'}`}>
          <span className="font-bold mr-2">3.</span>
          <div>
            From your profile, navigate to the "Likes" tab.
            {likesViewConfirmed && (
              <div className="mt-1 text-sm text-green-700">
                ✓ "Likes" page confirmed. Awaiting proof generation...
              </div>
            )}
          </div>
        </li>
      </ol>
      
      {/* Final Proof Confirmation */}
      {proof && (
        <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-md text-sm text-green-800" role="status">
          <strong>Proof generated successfully!</strong> You may now click the "Submit Proof of Completion" button below.
        </div>
      )}
    </div>
  );
};