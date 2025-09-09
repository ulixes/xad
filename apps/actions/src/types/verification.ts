export interface ProfileData {
  username: string;
  fullName: string;
  biography: string;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  mediaCount: number;
  profilePicUrl: string;
  accountType: number;
  isPrivate: boolean;
  isBusiness: boolean;
  category?: string;
  externalUrl?: string;
}

export interface VerificationResult {
  success: boolean;
  profileData?: ProfileData;
  error?: string;
}

export interface PlatformVerifier {
  platform: string;
  verifyAccount(username: string, tabId: number): Promise<VerificationResult>;
  extractProfileData(responseBody: string): ProfileData | null;
  isTargetRequest(url: string): boolean;
}

export type VerificationMessage = 
  | { type: 'START_VERIFICATION'; platform: string; username: string }
  | { type: 'VERIFICATION_COMPLETE'; profileData: ProfileData }
  | { type: 'VERIFICATION_ERROR'; error: string };