// Twitter Retweet Verification Config
export const twitterRetweetsConfig = {
  type: 'X_RETWEET',
  platform: 'x',
  contentType: 'retweet',
  
  // URL pattern: x.com/username/with_replies
  urlRegex: /https:\/\/x\.com\/[^/]+\/with_replies/,
  
  // Extract username from URL
  getUsernameFromUrl: function(url: string): string {
    const match = url.match(/x\.com\/([^/]+)\/with_replies/);
    return match ? match[1] : 'unknown';
  },
  
  // Context = WHO is doing the retweeting (the user whose replies page we're on)
  context: {
    endpointIdentifier: 'UserTweetsAndReplies',
    parser: function parseUserResponse(raw: any) {
      // For retweet verification, we might not need detailed context parsing
      // since we're checking the retweets directly
      return {
        id: null,
        name: null,
        handle: 'unknown',
        avatar: null,
        verified: null,
        followers: null,
        following: null
      };
    }
  },
  
  // Action = WHAT they retweeted (search for target tweet ID in their retweets)
  action: {
    endpointIdentifier: 'UserTweetsAndReplies',
    parser: function parseAndVerifyRetweets(raw: any, targetTweetId: string) {
      const retweets: any[] = [];
      let targetFound = false;
      
      console.log('🔍 Parsing UserTweetsAndReplies for target tweet:', targetTweetId);

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
              // Handle individual timeline items (tweets/retweets)
              if (entry.content?.entryType === 'TimelineTimelineItem' && 
                  entry.content?.itemContent?.itemType === 'TimelineTweet') {
                
                const tweet = entry.content.itemContent.tweet_results?.result;
                if (tweet && tweet.__typename === 'Tweet') {
                  const legacy = tweet.legacy;
                  
                  // Check if this is a retweet
                  if (legacy?.retweeted === true && legacy.retweeted_status_result) {
                    const originalTweet = legacy.retweeted_status_result.result;
                    const retweetData = {
                      id: tweet.rest_id,
                      text: legacy.full_text,
                      created_at: legacy.created_at,
                      original_tweet_id: originalTweet?.rest_id,
                      original_user: originalTweet?.core?.user_results?.result?.core?.screen_name
                    };
                    
                    retweets.push(retweetData);
                    console.log(`🔄 Found retweet: ${retweetData.id} of original tweet: ${retweetData.original_tweet_id}`);
                    
                    // Check if this retweet is of our target tweet
                    if (originalTweet?.rest_id === targetTweetId) {
                      targetFound = true;
                      console.log('🎯 FOUND TARGET! User retweeted the target tweet:', retweetData);
                    }
                  }
                }
              }
              
              // Also handle timeline modules (conversations, etc.)
              if (entry.content?.entryType === 'TimelineTimelineModule') {
                const items = entry.content.items || [];
                for (const item of items) {
                  const tweet = item.item?.itemContent?.tweet_results?.result;
                  if (tweet && tweet.__typename === 'Tweet') {
                    const legacy = tweet.legacy;
                    
                    // Check if this is a retweet
                    if (legacy?.retweeted === true && legacy.retweeted_status_result) {
                      const originalTweet = legacy.retweeted_status_result.result;
                      const retweetData = {
                        id: tweet.rest_id,
                        text: legacy.full_text,
                        created_at: legacy.created_at,
                        original_tweet_id: originalTweet?.rest_id,
                        original_user: originalTweet?.core?.user_results?.result?.core?.screen_name
                      };
                      
                      retweets.push(retweetData);
                      console.log(`🔄 Found retweet in module: ${retweetData.id} of original tweet: ${retweetData.original_tweet_id}`);
                      
                      // Check if this retweet is of our target tweet
                      if (originalTweet?.rest_id === targetTweetId) {
                        targetFound = true;
                        console.log('🎯 FOUND TARGET! User retweeted the target tweet:', retweetData);
                      }
                    }
                  }
                }
              }
            }
          }
        }

        console.log(`📊 FINAL RESULT: ${retweets.length} total retweets, target found: ${targetFound}`);
        console.log('🔍 All retweets:', retweets.map(r => `${r.id} (original: ${r.original_tweet_id})`));
        console.log('🎯 Target tweet ID:', targetTweetId);
        
        return {
          retweets,
          targetTweetId,
          proofResult: targetFound, // THE PROOF: true/false 
          totalRetweets: retweets.length,
          userRetweeted: targetFound
        };

      } catch (error) {
        console.error('❌ Error parsing retweets:', error);
        return {
          retweets: [],
          targetTweetId,
          proofResult: false,
          totalRetweets: 0,
          userRetweeted: false,
          error: error instanceof Error ? error.message : 'Parse error'
        };
      }
    }
  }
};

console.log('Twitter Retweets Config:', {
  type: twitterRetweetsConfig.type,
  platform: twitterRetweetsConfig.platform,
  contentType: twitterRetweetsConfig.contentType,
  urlPattern: twitterRetweetsConfig.urlRegex.toString(),
  contextEndpoint: twitterRetweetsConfig.context.endpointIdentifier,
  actionEndpoint: twitterRetweetsConfig.action.endpointIdentifier
});