// Target encoding utilities for the web app (browser-compatible)

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
 * Simple obfuscation using Base64 and character shifting
 * This provides basic privacy without complex crypto dependencies
 */
function obfuscateString(str: string): string {
  // Shift each character by a fixed amount
  const shifted = str.split('').map(char => {
    const code = char.charCodeAt(0);
    // Shift by 13 (ROT13 style) for letters, by 5 for numbers
    if (code >= 65 && code <= 90) { // A-Z
      return String.fromCharCode(((code - 65 + 13) % 26) + 65);
    } else if (code >= 97 && code <= 122) { // a-z
      return String.fromCharCode(((code - 97 + 13) % 26) + 97);
    } else if (code >= 48 && code <= 57) { // 0-9
      return String.fromCharCode(((code - 48 + 5) % 10) + 48);
    }
    return char;
  }).join('');
  
  // Then Base64 encode
  return btoa(shifted);
}

/**
 * Convert string to hex string with 0x prefix (no encryption for now)
 * In production, implement proper encryption that works both client and server side
 */
export function toHex(str: string): string {
  const bytes = new TextEncoder().encode(str)
  return '0x' + Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Full encode process for sending to blockchain (with obfuscation)
 */
export async function prepareTargetsForBlockchain(targets: ActionTargets): Promise<string> {
  const encoded = encodeTargets(targets)
  // Obfuscate the encoded string for privacy
  const obfuscated = obfuscateString(encoded)
  return obfuscated;
}

/**
 * Encode targets for simple storage (used in payment flow)
 * This creates a simple "handle:videoId|followHandle" format then obfuscates it
 */
export function encodeTargetsSimple(likeHandle: string, videoId: string, followHandle: string): string {
  const data = `${likeHandle}:${videoId}|${followHandle}`;
  // Obfuscate for privacy
  return obfuscateString(data);
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