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
  | { type: 'VERIFICATION_ERROR'; error: string }
  | { type: 'CREATE_VERIFICATION_TAB'; platform: string; username: string }
  | { type: 'TAB_CREATED'; tabId: number }
  | { type: 'TAB_CREATION_ERROR'; error: string }
  | { type: 'ATTACH_DEBUGGER'; tabId: number; username: string }
  | { type: 'DEBUGGER_ATTACHED' }
  | { type: 'DEBUGGER_ATTACHMENT_ERROR'; error: string }
  | { type: 'CLEANUP_VERIFICATION'; tabId: number }
  | { type: 'CLEANUP_COMPLETE' }
  | { type: 'VERIFICATION_RESPONSE'; tabId: number; profileData: ProfileData; requestId: string }
  | { type: 'BUILD_IG_PROFILE_COMPLETE'; username: string; userId: string }
  | { type: 'IG_PROFILE_COMPLETE'; username: string; userId: string; profileData: any }
  | { type: 'IG_PROFILE_ERROR'; error: string };