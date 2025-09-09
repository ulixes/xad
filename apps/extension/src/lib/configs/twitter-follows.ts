// Twitter Follow Verification Config
export const twitterFollowsConfig = {
  type: 'X_FOLLOW',
  platform: 'x',
  contentType: 'follow',
  
  // URL pattern: x.com/username/following
  urlRegex: /https:\/\/x\.com\/[^/]+\/following/,
  
  // Extract username from URL
  getUsernameFromUrl: function(url: string): string {
    const match = url.match(/x\.com\/([^/]+)\/following/);
    return match ? match[1] : 'unknown';
  },
  
  // Context = WHO is doing the following (the user whose following page we're on)
  context: {
    endpointIdentifier: 'Following',
    parser: function parseFollowerResponse(raw: any) {
      // Extract username from current URL
      const getUsernameFromUrl = function(url: string): string {
        const match = url.match(/x\.com\/([^/]+)\/following/);
        return match ? match[1] : 'unknown';
      };
      
      // For follow verification, we might not need detailed context parsing
      // since we're checking the following list directly
      return {
        id: null, // Could extract from the API if needed
        name: null,
        handle: 'unknown', // Skip URL extraction for now
        avatar: null,
        verified: null,
        followers: null,
        following: null
      };
    }
  },
  
  // Action = WHO they are following (search for target username in their following list)
  action: {
    endpointIdentifier: 'Following',
    parser: function parseAndVerifyFollows(raw: any, targetUsername: string) {
      const followedUsers: any[] = [];
      let targetFound = false;
      
      console.log('🔍 Parsing Following for target user:', targetUsername);

      try {
        const timeline = raw?.data?.user?.result?.timeline?.timeline;
        const instructions = timeline?.instructions || [];
        
        console.log(`📋 Processing ${instructions.length} timeline instructions`);

        // Process all timeline instructions
        for (const instruction of instructions) {
          if (instruction.type === 'TimelineAddEntries') {
            const entries = instruction.entries || [];
            console.log(`📝 Processing ${entries.length} timeline entries`);
            
            for (const entry of entries) {
              // Handle individual timeline items (users being followed)
              if (entry.content?.entryType === 'TimelineTimelineItem' && 
                  entry.content?.itemContent?.itemType === 'TimelineUser') {
                
                const user = entry.content.itemContent.user_results?.result;
                if (user && user.__typename === 'User') {
                  const followedUser = {
                    id: user.rest_id,
                    name: user.core?.name,
                    handle: user.core?.screen_name,
                    avatar: user.avatar?.image_url,
                    verified: user.is_blue_verified || user.legacy?.verified,
                    followers: user.legacy?.followers_count,
                    following: user.legacy?.friends_count,
                    description: user.legacy?.description
                  };
                  
                  followedUsers.push(followedUser);
                  console.log(`👤 Found followed user: @${followedUser.handle} (${followedUser.name})`);
                  
                  // Check if this is our target user (case-insensitive comparison)
                  if (followedUser.handle && targetUsername && 
                      followedUser.handle.toLowerCase() === targetUsername.toLowerCase()) {
                    targetFound = true;
                    console.log('🎯 FOUND TARGET! User is following:', followedUser);
                  }
                }
              }
            }
          }
        }

        console.log(`📊 FINAL RESULT: ${followedUsers.length} total followed users, target found: ${targetFound}`);
        console.log('🔍 All followed users:', followedUsers.map(u => `@${u.handle}`));
        console.log('🎯 Target username:', targetUsername);
        
        return {
          followedUsers,
          targetUsername,
          proofResult: targetFound, // THE PROOF: true/false 
          totalFollowing: followedUsers.length,
          userIsFollowing: targetFound
        };

      } catch (error) {
        console.error('❌ Error parsing follows:', error);
        return {
          followedUsers: [],
          targetUsername,
          proofResult: false,
          totalFollowing: 0,
          userIsFollowing: false,
          error: error instanceof Error ? error.message : 'Parse error'
        };
      }
    }
  }
};

console.log('Twitter Follows Config:', {
  type: twitterFollowsConfig.type,
  platform: twitterFollowsConfig.platform,
  contentType: twitterFollowsConfig.contentType,
  urlPattern: twitterFollowsConfig.urlRegex.toString(),
  contextEndpoint: twitterFollowsConfig.context.endpointIdentifier,
  actionEndpoint: twitterFollowsConfig.action.endpointIdentifier
});