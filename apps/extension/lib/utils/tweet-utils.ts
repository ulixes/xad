/**
 * Extract tweet ID from various Twitter/X URL formats
 * Supports:
 * - https://twitter.com/username/status/1234567890
 * - https://x.com/username/status/1234567890  
 * - https://mobile.twitter.com/username/status/1234567890
 */
export function extractTweetId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Find the index of 'status' in the path
    const statusIndex = pathParts.findIndex(part => part === 'status');
    
    if (statusIndex !== -1 && statusIndex + 1 < pathParts.length) {
      const tweetId = pathParts[statusIndex + 1];
      // Tweet IDs are numeric strings, validate format
      if (/^\d+$/.test(tweetId)) {
        return tweetId;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract multiple tweet IDs from an array of URLs
 */
export function extractTweetIds(urls: string[]): string[] {
  return urls
    .map(extractTweetId)
    .filter((id): id is string => id !== null);
}