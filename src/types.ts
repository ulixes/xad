// Root response for a profile Likes tab
export interface LikesResponse {
  liker: NormalizedUser;   // the profile owner (the one who liked these tweets)
  tweets: FlatTweet[];     // just a flat list of liked tweets
}   

// Generic user (can be liker or tweet author)
export interface NormalizedUser {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  verified?: boolean;
  followers?: number;
  following?: number;
  createdAt?: string;
}

// Flattened tweet object with author
export interface FlatTweet {
  id: string;
  text?: string;
  createdAt?: string;
  lang?: string;
  stats: {
    likes?: number;
    retweets?: number;
    replies?: number;
    quotes?: number;
    bookmarks?: number;
    views?: string;
  };
  media: NormalizedMedia[];
  author: NormalizedUser;  // the tweet’s owner
}
// Media objects inside tweets
export interface NormalizedMedia {
  id: string;
  type: "photo" | "video" | "animated_gif";
  url: string;
  displayUrl?: string;
  expandedUrl?: string;
  videoVariants?: VideoVariant[];
}

export interface VideoVariant {
  bitrate?: number;
  contentType: string;
  url: string;
}

// Evidence object for task submission
export interface TaskEvidence {
  proof: LikesResponse;           // Original likes data from browser extension
  taskTargets: string[];          // Extracted tweet IDs from task targets
  validatedLikes: string[];       // Tweet IDs that were found in user's likes
  isValid: boolean;              // Whether all target tweets were found in likes
  summary: {
    totalTargets: number;        // Total number of target tweets
    foundInLikes: number;        // Number of targets found in likes
    missingFromLikes: string[];  // Tweet IDs not found in likes
  };
}
