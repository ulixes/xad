/**
 * URL Encoder/Obfuscator for Privacy
 * Encodes TikTok URLs to prevent exposing usernames and post IDs on-chain
 */

// Simple reversible encoding using base64 + salt for basic obfuscation
const SALT = 'xad2024campaign';

/**
 * Validates and extracts data from TikTok URLs
 */
export function validateTikTokUrl(url: string, type: 'follow' | 'like'): { isValid: boolean; error?: string; data?: { handle: string; videoId?: string } } {
  if (!url || !url.trim()) {
    return { isValid: false, error: 'URL is required' };
  }

  // Clean up URL
  const cleanUrl = url.trim().toLowerCase();

  // Check if it's a TikTok URL
  const tiktokPatterns = [
    /^https?:\/\/(www\.)?tiktok\.com/,
    /^https?:\/\/vm\.tiktok\.com/,
    /^https?:\/\/vt\.tiktok\.com/
  ];

  const isTikTok = tiktokPatterns.some(pattern => pattern.test(cleanUrl));
  if (!isTikTok) {
    return { isValid: false, error: 'Must be a TikTok URL' };
  }

  if (type === 'follow') {
    // Profile URL patterns:
    // https://www.tiktok.com/@username
    // https://tiktok.com/@username
    const profileMatch = cleanUrl.match(/tiktok\.com\/@([a-z0-9_\.]+)(?:\/|$|\?)/);
    
    if (!profileMatch) {
      return { isValid: false, error: 'Invalid TikTok profile URL. Format: https://tiktok.com/@username' };
    }

    // Make sure it's not a video URL
    if (cleanUrl.includes('/video/')) {
      return { isValid: false, error: 'Please provide a profile URL, not a video URL' };
    }

    return {
      isValid: true,
      data: {
        handle: profileMatch[1]
      }
    };
  } else {
    // Like URL patterns (video URLs):
    // https://www.tiktok.com/@username/video/1234567890
    // https://vm.tiktok.com/ABC123/ (short URL)
    
    // Check for short URL
    const shortUrlMatch = cleanUrl.match(/v[mt]\.tiktok\.com\/([a-z0-9]+)/i);
    if (shortUrlMatch) {
      // Short URLs are valid but we can't extract username/videoId
      // We'll encode the whole short URL
      return {
        isValid: true,
        data: {
          handle: 'short',
          videoId: shortUrlMatch[1]
        }
      };
    }

    // Check for full video URL
    const videoMatch = cleanUrl.match(/tiktok\.com\/@([a-z0-9_\.]+)\/video\/(\d+)/);
    
    if (!videoMatch) {
      return { isValid: false, error: 'Invalid TikTok video URL. Format: https://tiktok.com/@username/video/123456789' };
    }

    return {
      isValid: true,
      data: {
        handle: videoMatch[1],
        videoId: videoMatch[2]
      }
    };
  }
}

/**
 * Encodes a URL for privacy before storing on-chain
 */
export function encodeUrl(url: string): string {
  // Add salt and encode
  const salted = SALT + url;
  // Convert to base64
  const encoded = btoa(salted);
  // Further obfuscate by reversing and adding markers
  const obfuscated = 'xad_' + encoded.split('').reverse().join('') + '_v1';
  return obfuscated;
}

/**
 * Batch encode URLs for campaign actions
 */
export function encodeCampaignActions(
  followUrl: string,
  likeUrls: string[]
): {
  encodedFollowTarget: string;
  encodedLikeTargets: string[];
} {
  // Validate and encode follow URL
  const followValidation = validateTikTokUrl(followUrl, 'follow');
  if (!followValidation.isValid) {
    throw new Error(`Follow URL error: ${followValidation.error}`);
  }

  // Validate and encode like URLs
  const encodedLikeTargets: string[] = [];
  for (let i = 0; i < likeUrls.length; i++) {
    const likeValidation = validateTikTokUrl(likeUrls[i], 'like');
    if (!likeValidation.isValid) {
      throw new Error(`Like URL ${i + 1} error: ${likeValidation.error}`);
    }
    encodedLikeTargets.push(encodeUrl(likeUrls[i]));
  }

  return {
    encodedFollowTarget: encodeUrl(followUrl),
    encodedLikeTargets
  };
}

/**
 * Decode a URL (for internal use only, not exposed to UI)
 */
export function decodeUrl(encoded: string): string {
  if (!encoded.startsWith('xad_') || !encoded.endsWith('_v1')) {
    throw new Error('Invalid encoded URL format');
  }
  
  // Remove markers and reverse
  const withoutMarkers = encoded.slice(4, -3);
  const reversed = withoutMarkers.split('').reverse().join('');
  
  // Decode from base64
  const decoded = atob(reversed);
  
  // Remove salt
  if (!decoded.startsWith(SALT)) {
    throw new Error('Invalid encoded URL');
  }
  
  return decoded.slice(SALT.length);
}