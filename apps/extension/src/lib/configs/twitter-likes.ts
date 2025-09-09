// Twitter Likes Verification Config
export const twitterLikesConfig = {
  type: 'X_LIKE',
  platform: 'x',
  contentType: 'like',
  
  // URL pattern: x.com/username/likes
  urlRegex: /https:\/\/x\.com\/[^/]+\/likes/,
  
  // Extract username from URL
  getUsernameFromUrl: function(url: string): string {
    const match = url.match(/x\.com\/([^/]+)\/likes/);
    return match ? match[1] : 'unknown';
  },
  
  // Context = WHO liked (the user whose likes page we're on)
  context: {
    endpointIdentifier: 'ProfileSpotlightsQuery',
    parser: function parseLikerResponse(raw: any) {
      const user = raw?.data?.user_result_by_screen_name?.result;
      return {
        id: user?.rest_id,
        name: user?.core?.name,
        handle: user?.core?.screen_name,
        avatar: user?.legacy?.profile_image_url_https,
        verified: user?.is_blue_verified || user?.legacy?.verified,
        followers: user?.legacy?.followers_count,
        following: user?.legacy?.friends_count,
        createdAt: user?.legacy?.created_at
      };
    }
  },
  
  // Action = WHAT they liked (search for target tweet ID in their likes)
  action: {
    endpointIdentifier: 'Likes',
    parser: function parseAndVerifyLikes(raw: any, targetTweetId: string) {
      const tweets: any[] = [];
      const instructions = raw?.data?.user?.result?.timeline?.timeline?.instructions ?? [];
      
      let targetFound = false;
      
      for (const instruction of instructions) {
        for (const entry of instruction.entries ?? []) {
          const tweet = entry?.content?.itemContent?.tweet_results?.result;
          if (!tweet || tweet.__typename !== "Tweet") continue;

          const tweetId = tweet.rest_id;
          
          // Check if this is our target tweet
          if (tweetId === targetTweetId) {
            targetFound = true;
          }

          tweets.push({
            id: tweetId,
            text: tweet.legacy?.full_text,
            createdAt: tweet.legacy?.created_at,
            isTarget: tweetId === targetTweetId // Mark the target tweet
          });
        }
      }
      
      return {
        tweets,
        targetTweetId,
        proofResult: targetFound, // THE PROOF: true/false
        totalLikes: tweets.length
      };
    }
  }
};

console.log('Twitter Likes Config:', {
  type: twitterLikesConfig.type,
  platform: twitterLikesConfig.platform,
  contentType: twitterLikesConfig.contentType,
  urlPattern: twitterLikesConfig.urlRegex.toString(),
  contextEndpoint: twitterLikesConfig.context.endpointIdentifier,
  actionEndpoint: twitterLikesConfig.action.endpointIdentifier
});