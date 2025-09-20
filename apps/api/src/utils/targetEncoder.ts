// Target encoding utilities for the API
// TODO: Add proper encryption that works both client and server side

export interface TikTokTarget {
  username: string
  videoId?: string  // Optional for follow actions
}

export interface ActionTargets {
  likeTargets: TikTokTarget[]
  followTarget: TikTokTarget
}

/**
 * Parse a TikTok URL and extract username and video ID
 * Examples:
 * - https://www.tiktok.com/@jacoboestreichercoaching/video/7551115162124635447
 * - https://www.tiktok.com/@username
 */
export function parseTikTokUrl(url: string): TikTokTarget {
  // Remove protocol and www
  const cleanUrl = url.replace(/^https?:\/\/(www\.)?/, '')
  
  // Check if it's a TikTok URL
  if (!cleanUrl.startsWith('tiktok.com/')) {
    throw new Error('Invalid TikTok URL')
  }
  
  // Extract path after tiktok.com/
  const path = cleanUrl.replace('tiktok.com/', '')
  
  // Extract username (starts with @)
  const usernameMatch = path.match(/^@([^\/]+)/)
  if (!usernameMatch) {
    throw new Error('Invalid TikTok URL: no username found')
  }
  
  const username = usernameMatch[1]
  
  // Extract video ID if present
  const videoMatch = path.match(/video\/(\d+)/)
  const videoId = videoMatch ? videoMatch[1] : undefined
  
  return { username, videoId }
}

/**
 * Build a TikTok URL from components
 */
export function buildTikTokUrl(target: TikTokTarget): string {
  const baseUrl = `https://www.tiktok.com/@${target.username}`
  return target.videoId ? `${baseUrl}/video/${target.videoId}` : baseUrl
}

/**
 * Encode action targets into a compact string format
 * Format: "username:videoId1,videoId2|followUsername"
 * Example: "jacoboestreicher:7551115162124635447,7551115162124635448|jacoboestreicher"
 */
export function encodeTargets(targets: ActionTargets): string {
  // Encode like targets
  const likeTargetsStr = targets.likeTargets
    .map(t => t.videoId || '')
    .join(',')
  
  // Get the username from the first like target (assuming all likes are for the same user)
  const likeUsername = targets.likeTargets[0]?.username || ''
  
  // Encode follow target
  const followUsername = targets.followTarget.username
  
  // Combine: "username:videoIds|followUsername"
  return `${likeUsername}:${likeTargetsStr}|${followUsername}`
}

/**
 * Decode the compact string format back to ActionTargets
 */
export function decodeTargets(encoded: string): ActionTargets {
  const [likePart, followUsername] = encoded.split('|')
  
  if (!likePart || !followUsername) {
    throw new Error('Invalid encoded targets format')
  }
  
  const [likeUsername, videoIdsStr] = likePart.split(':')
  const videoIds = videoIdsStr ? videoIdsStr.split(',').filter(id => id) : []
  
  // Create like targets
  const likeTargets = videoIds.map(videoId => ({
    username: likeUsername,
    videoId
  }))
  
  // Create follow target
  const followTarget = {
    username: followUsername
  }
  
  return { likeTargets, followTarget }
}

/**
 * Decode obfuscated string (reverse of client-side obfuscation)
 * Reverses ROT13 for letters and shift-5 for numbers, then Base64 decodes
 */
function deobfuscateString(obfuscated: string): string {
  try {
    // Base64 decode first
    const shifted = Buffer.from(obfuscated, 'base64').toString('utf-8');
    
    // Reverse the character shifting
    const original = shifted.split('').map(char => {
      const code = char.charCodeAt(0);
      // Reverse shift by 13 (ROT13 style) for letters, by 5 for numbers
      if (code >= 65 && code <= 90) { // A-Z
        return String.fromCharCode(((code - 65 - 13 + 26) % 26) + 65);
      } else if (code >= 97 && code <= 122) { // a-z
        return String.fromCharCode(((code - 97 - 13 + 26) % 26) + 97);
      } else if (code >= 48 && code <= 57) { // 0-9
        return String.fromCharCode(((code - 48 - 5 + 10) % 10) + 48);
      }
      return char;
    }).join('');
    
    return original;
  } catch (error) {
    console.error('Failed to deobfuscate:', error);
    // Fallback: assume it's not obfuscated
    return obfuscated;
  }
}

/**
 * Convert hex string to regular string (no decryption for now)
 */
export function hexToString(hexData: string): string {
  // Remove 0x prefix if present
  const cleanHex = hexData.startsWith('0x') ? hexData.slice(2) : hexData
  const buffer = Buffer.from(cleanHex, 'hex')
  return buffer.toString('utf8')
}

/**
 * Full encode process for sending to blockchain (simplified without encryption)
 */
export function prepareTargetsForBlockchain(targets: ActionTargets): string {
  const encoded = encodeTargets(targets)
  // For now, just hex encode without encryption
  // TODO: Implement compatible encryption between web and API
  const bytes = Buffer.from(encoded, 'utf8')
  return '0x' + bytes.toString('hex')
}

/**
 * Parse targets from blockchain - handles both obfuscated and plain formats
 * Returns simple format: {likeHandle, videoId, followHandle}
 */
export function parseTargetsFromBlockchain(encoded: string): {
  likeHandle: string;
  videoId: string;
  followHandle: string;
} {
  try {
    // First try to deobfuscate (for new format)
    const deobfuscated = deobfuscateString(encoded);
    
    // Parse the format: "handle:videoId|followHandle"
    const [likeTarget, followHandle] = deobfuscated.split('|');
    
    if (!likeTarget || !followHandle) {
      // Fallback: assume it's plain text if splitting fails
      const [plainLikeTarget, plainFollowHandle] = encoded.split('|');
      const [plainLikeHandle, plainVideoId] = plainLikeTarget.split(':');
      
      return {
        likeHandle: plainLikeHandle || 'unknown',
        videoId: plainVideoId || '0',
        followHandle: plainFollowHandle || 'unknown'
      };
    }
    
    const [likeHandle, videoId] = likeTarget.split(':');
    
    return {
      likeHandle: likeHandle || 'unknown',
      videoId: videoId || '0',
      followHandle: followHandle || 'unknown'
    };
  } catch (error) {
    console.error('Failed to parse targets:', error);
    // Ultimate fallback: return defaults
    return {
      likeHandle: 'unknown',
      videoId: '0',
      followHandle: 'unknown'
    };
  }
}

/**
 * Parse multiple TikTok URLs and create ActionTargets
 */
export function parseUrlsToTargets(likeUrls: string[], followUrl: string): ActionTargets {
  const likeTargets = likeUrls.map(url => parseTikTokUrl(url))
  const followTarget = parseTikTokUrl(followUrl)
  
  return { likeTargets, followTarget }
}

/**
 * Convert ActionTargets back to full URLs
 */
export function targetsToUrls(targets: ActionTargets): {
  likeUrls: string[]
  followUrl: string
} {
  const likeUrls = targets.likeTargets.map(t => buildTikTokUrl(t))
  const followUrl = buildTikTokUrl(targets.followTarget)
  
  return { likeUrls, followUrl }
}