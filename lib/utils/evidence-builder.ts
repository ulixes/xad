import { LikesResponse, TaskEvidence } from '@/src/types';
import { extractTweetIds } from './tweet-utils';

/**
 * Build a proper evidence object that validates task completion
 * @param likesResponse - The likes data from browser extension
 * @param taskTargets - Array of target tweet URLs from the task
 * @returns TaskEvidence object with validation
 */
export function buildTaskEvidence(
  likesResponse: LikesResponse, 
  taskTargets: string[]
): TaskEvidence {
  // Extract tweet IDs from target URLs
  const taskTargetIds = extractTweetIds(taskTargets);
  
  // Get all tweet IDs from the likes response
  const likedTweetIds = likesResponse.tweets.map(tweet => tweet.id);
  
  // Find which target tweets are in the user's likes
  const validatedLikes = taskTargetIds.filter(targetId => 
    likedTweetIds.includes(targetId)
  );
  
  // Find missing tweets
  const missingFromLikes = taskTargetIds.filter(targetId => 
    !likedTweetIds.includes(targetId)
  );
  
  // Task is valid if all target tweets are found in likes
  const isValid = validatedLikes.length === taskTargetIds.length && taskTargetIds.length > 0;
  
  return {
    proof: likesResponse,
    taskTargets: taskTargetIds,
    validatedLikes,
    isValid,
    summary: {
      totalTargets: taskTargetIds.length,
      foundInLikes: validatedLikes.length,
      missingFromLikes
    }
  };
}