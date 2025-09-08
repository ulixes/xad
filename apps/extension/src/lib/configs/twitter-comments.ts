export const twitterCommentsConfig = {
  type: 'X_COMMENT',
  platform: 'x', 
  contentType: 'comment',
  urlRegex: /https:\/\/x\.com\/[^/]+\/with_replies/,
  context: {
    endpointIdentifier: 'UserTweetsAndReplies', // Use same endpoint to extract user context
    parser: function parseCommenterResponse(raw: any) {
      // Extract user info from the UserTweetsAndReplies response  
      const user = raw?.data?.user?.result;
      if (!user) return null;
      
      return {
        id: user.rest_id,
        name: user.core?.name || user.legacy?.name,
        handle: user.core?.screen_name || user.legacy?.screen_name,
        avatar: user.avatar?.image_url || user.legacy?.profile_image_url_https,
        verified: user.verification?.verified || user.legacy?.verified,
        followers: user.legacy?.followers_count,
        following: user.legacy?.friends_count,
        location: user.location?.location,
        description: user.legacy?.description
      };
    }
  },
  action: {
    endpointIdentifier: 'UserTweetsAndReplies',
    parser: function parseAndVerifyComments(raw: any, targetTweetId: string) {
      const comments: any[] = [];
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
              // Handle individual timeline items (direct tweets/replies)
              if (entry.content?.entryType === 'TimelineTimelineItem') {
                const tweet = entry.content?.itemContent?.tweet_results?.result;
                if (tweet && tweet.legacy?.in_reply_to_status_id_str) {
                  const comment = {
                    id: tweet.rest_id,
                    text: tweet.legacy.full_text,
                    replyToTweetId: tweet.legacy.in_reply_to_status_id_str,
                    replyToUserId: tweet.legacy.in_reply_to_user_id_str,
                    replyToScreenName: tweet.legacy.in_reply_to_screen_name,
                    authorId: tweet.legacy.user_id_str,
                    createdAt: tweet.legacy.created_at,
                    replyCount: tweet.legacy.reply_count || 0,
                    likeCount: tweet.legacy.favorite_count || 0,
                    retweetCount: tweet.legacy.retweet_count || 0
                  };
                  
                  comments.push(comment);
                  console.log(`💬 Found reply: ${comment.id} -> ${comment.replyToTweetId}`);
                  
                  // Check if this comment is replying to our target tweet
                  if (comment.replyToTweetId === targetTweetId) {
                    targetFound = true;
                    console.log('🎯 FOUND TARGET! Reply to target tweet:', comment);
                  }
                }
              }
              
              // Handle timeline modules (conversation threads) 
              else if (entry.content?.entryType === 'TimelineTimelineModule') {
                const items = entry.content.items || [];
                console.log(`🧵 Processing conversation module with ${items.length} items`);
                
                for (const item of items) {
                  const tweet = item.item?.itemContent?.tweet_results?.result;
                  if (tweet && tweet.legacy?.in_reply_to_status_id_str) {
                    const comment = {
                      id: tweet.rest_id,
                      text: tweet.legacy.full_text,
                      replyToTweetId: tweet.legacy.in_reply_to_status_id_str,
                      replyToUserId: tweet.legacy.in_reply_to_user_id_str,
                      replyToScreenName: tweet.legacy.in_reply_to_screen_name,
                      authorId: tweet.legacy.user_id_str,
                      createdAt: tweet.legacy.created_at,
                      replyCount: tweet.legacy.reply_count || 0,
                      likeCount: tweet.legacy.favorite_count || 0,
                      retweetCount: tweet.legacy.retweet_count || 0
                    };
                    
                    comments.push(comment);
                    console.log(`💬 Found thread reply: ${comment.id} -> ${comment.replyToTweetId}`);
                    
                    // Check if this comment is replying to our target tweet
                    if (comment.replyToTweetId === targetTweetId) {
                      targetFound = true;
                      console.log('🎯 FOUND TARGET! Thread reply to target tweet:', comment);
                    }
                  }
                }
              }
            }
          }
        }

        console.log(`📊 FINAL RESULT: ${comments.length} total comments, target found: ${targetFound}`);
        console.log('🔍 All reply targets found:', comments.map(c => c.replyToTweetId));
        
        return {
          comments,
          targetTweetId,
          proofResult: targetFound, // THE PROOF: true/false 
          totalComments: comments.length,
          userHasCommented: targetFound
        };

      } catch (error) {
        console.error('❌ Error parsing comments:', error);
        return {
          comments: [],
          targetTweetId,
          proofResult: false,
          totalComments: 0,
          userHasCommented: false,
          error: error instanceof Error ? error.message : 'Parse error'
        };
      }
    }
  }
};

console.log('Twitter Comments Config:', twitterCommentsConfig);