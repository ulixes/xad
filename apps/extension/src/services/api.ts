import type { User, SocialAccount, InstagramMetadata, EligibleAction, EligibleActionsResponse } from '@/src/types';
import type { 
  ActionRun, 
  CreateActionRunRequest, 
  UpdateActionRunRequest 
} from '@/src/types/actionRun';

// Get API URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

class APIClient {
  private baseUrl: string;
  private getAccessToken: (() => Promise<string | null>) | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Set the function to get Privy access token
  setAccessTokenGetter(getter: () => Promise<string | null>) {
    this.getAccessToken = getter;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get Privy access token if available
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true', // Skip ngrok warning page
      ...options.headers,
    };

    if (this.getAccessToken) {
      try {
        const token = await this.getAccessToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Failed to get access token:', error);
      }
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      const error = new Error(errorData.error || `HTTP ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  }

  // Get or create user with current authentication
  async getOrCreateCurrentUser(): Promise<User | null> {
    try {
      // This endpoint will use the Privy token to identify the user
      return await this.request<User>('/api/users/current', {
        method: 'POST',
      });
    } catch (error: any) {
      console.error('Failed to get/create current user:', error);
      return null;
    }
  }

  // User endpoints
  async getUserByWallet(walletAddress: string): Promise<User | null> {
    try {
      return await this.request<User>(`/api/users/wallet/${walletAddress}`);
    } catch (error: any) {
      if (error.status === 404 || error.message.includes('User not found')) {
        return null;
      }
      throw error;
    }
  }

  async createUser(data: { walletAddress?: string; email?: string }): Promise<User> {
    return this.request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    return this.request<User>(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Social Account endpoints
  async getSocialAccount(accountId: string): Promise<SocialAccount> {
    return this.request<SocialAccount>(`/api/social-accounts/${accountId}`);
  }

  async getUserSocialAccounts(userId: string): Promise<SocialAccount[]> {
    return this.request<SocialAccount[]>(`/api/social-accounts/user/${userId}`);
  }

  async createSocialAccount(data: {
    userId: string;
    platform: string;
    handle: string;
    platformUserId?: string;
  }): Promise<SocialAccount> {
    return this.request<SocialAccount>('/api/social-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInstagramData(
    socialAccountId: string,
    metadata: InstagramMetadata,
    expectedHandle: string
  ): Promise<any> {
    // Extract the actual username from raw data
    const collectedUsername = metadata.rawData?.editPage?.username;
    
    // Validate that the collected username matches the expected handle
    if (!collectedUsername) {
      throw new Error('Username not found in collected data');
    }
    
    if (collectedUsername.toLowerCase() !== expectedHandle.toLowerCase()) {
      throw new Error(`Username mismatch: expected "${expectedHandle}" but collected "${collectedUsername}"`);
    }
    
    // Transform the metadata to match the API schema
    const instagramData = {
      instagramUserId: metadata.rawData?.editPage?.id || metadata.rawData?.insightsPage?.instagram_user_id,
      username: collectedUsername,
      fullName: metadata.profile.fullName,
      biography: metadata.profile.biography,
      profilePicUrl: metadata.profile.profilePicUrl,
      followerCount: metadata.profile.followerCount,
      followingCount: metadata.profile.followingCount,
      postCount: metadata.profile.postCount,
      isVerified: metadata.profile.isVerified,
      isPrivate: metadata.profile.isPrivate,
      isBusinessAccount: metadata.profile.isBusinessAccount,
      isProfessional: metadata.profile.isProfessional,
      accountType: metadata.profile.accountType,
      category: metadata.profile.category,
      externalUrl: metadata.profile.externalUrl,
      locationCountry: metadata.profile.locationCountry,
      locationCity: metadata.profile.locationCity,
      mediaCount: metadata.profile.mediaCount,
      
      // Performance metrics
      profileVisits7d: metadata.insights?.profileVisits?.sevenDays,
      profileVisits30d: metadata.insights?.profileVisits?.thirtyDays,
      profileVisits90d: metadata.insights?.profileVisits?.ninetyDays,
      accountsReached7d: metadata.insights?.accountsReached?.sevenDays,
      accountsReached30d: metadata.insights?.accountsReached?.thirtyDays,
      accountsEngaged7d: metadata.insights?.accountsEngaged?.sevenDays,
      accountsEngaged30d: metadata.insights?.accountsEngaged?.thirtyDays,
      followerGrowth7d: metadata.insights?.followerGrowth?.sevenDays,
      followerGrowth30d: metadata.insights?.followerGrowth?.thirtyDays,
      followerGrowth90d: metadata.insights?.followerGrowth?.ninetyDays,
      
      // Engagement metrics
      engagementRate: metadata.insights?.engagementRate,
      videoContentRatio: metadata.insights?.videoContentRatio,
      
      // Collection metadata
      lastCollectedAt: metadata.lastCollectedAt,
      rawData: metadata.rawData,
    };

    console.log('Sending Instagram data to API:', {
      endpoint: `/api/social-accounts/${socialAccountId}/instagram-data`,
      data: instagramData
    });
    
    return this.request(`/api/social-accounts/${socialAccountId}/instagram-data`, {
      method: 'POST',
      body: JSON.stringify(instagramData),
    });
  }

  async updateTikTokData(
    socialAccountId: string,
    payload: any,
    expectedHandle: string,
    hasViewerDemographics: boolean = false,
    hasFollowerDemographics: boolean = false
  ): Promise<any> {
    // Handle new enriched payload structure with optional viewer and follower demographics
    const collectedUsername = payload.uniqueId;
    
    // Validate that the collected username matches the expected handle
    if (!collectedUsername) {
      throw new Error('Username not found in collected TikTok data');
    }
    
    if (collectedUsername.toLowerCase() !== expectedHandle.toLowerCase()) {
      throw new Error(`TikTok username mismatch: expected "${expectedHandle}" but collected "${collectedUsername}"`);
    }
    
    // Transform the payload to match the API schema
    const tiktokData = {
      socialAccountId,
      uniqueId: collectedUsername,
      bio: payload.bio || '',
      isVerified: payload.isVerified || false,
      isPrivate: payload.isPrivate || false,
      analyticsOn: payload.analyticsOn || false,
      region: payload.region || null,
      language: payload.language || null,
      createTime: payload.createTime || null,
      // Include VIEWER demographics if available
      ...(hasViewerDemographics && payload.viewerDemographics && {
        viewerDemographics: {
          genderFemale: payload.viewerDemographics.gender?.female || 0,
          genderMale: payload.viewerDemographics.gender?.male || 0,
          genderOther: payload.viewerDemographics.gender?.other || 0,
          age18to24: payload.viewerDemographics.age?.['18-24'] || 0,
          age25to34: payload.viewerDemographics.age?.['25-34'] || 0,
          age35to44: payload.viewerDemographics.age?.['35-44'] || 0,
          age45to54: payload.viewerDemographics.age?.['45-54'] || 0,
          age55plus: payload.viewerDemographics.age?.['55+'] || 0,
          uniqueViewers: payload.viewerDemographics.viewers?.unique || 0,
          newViewers: payload.viewerDemographics.viewers?.new || 0,
          returningViewers: payload.viewerDemographics.viewers?.returning || 0,
          geography: payload.viewerDemographics.geography || []
        }
      }),
      // Include viewer metrics time-series data if available
      ...(payload.viewerMetrics && {
        viewerMetrics: payload.viewerMetrics
      }),
      // Include FOLLOWER demographics if available
      ...(hasFollowerDemographics && payload.followerDemographics && {
        followerDemographics: {
          followerCount: payload.followerDemographics.followerCount || 0,
          genderFemale: payload.followerDemographics.gender?.female || 0,
          genderMale: payload.followerDemographics.gender?.male || 0,
          genderOther: payload.followerDemographics.gender?.other || 0,
          age18to24: payload.followerDemographics.age?.['18-24'] || 0,
          age25to34: payload.followerDemographics.age?.['25-34'] || 0,
          age35to44: payload.followerDemographics.age?.['35-44'] || 0,
          age45to54: payload.followerDemographics.age?.['45-54'] || 0,
          age55plus: payload.followerDemographics.age?.['55+'] || 0,
          activeFollowers: payload.followerDemographics.activity?.active || 0,
          inactiveFollowers: payload.followerDemographics.activity?.inactive || 0,
          geography: payload.followerDemographics.geography || []
        }
      })
    };

    console.log('Sending TikTok data to API:', {
      endpoint: `/api/social-accounts/${socialAccountId}/tiktok-data`,
      data: tiktokData,
      hasViewerDemographics,
      hasFollowerDemographics
    });
    
    return this.request(`/api/social-accounts/${socialAccountId}/tiktok-data`, {
      method: 'POST',
      body: JSON.stringify(tiktokData),
    });
  }

  async saveTikTokDemographics(
    socialAccountId: string,
    demographics: {
      genderFemale: number;
      genderMale: number;
      genderOther: number;
      age18to24: number;
      age25to34: number;
      age35to44: number;
      age45to54: number;
      age55plus: number;
      uniqueViewers: number;
      newViewers: number;
      returningViewers: number;
      geography: Array<{
        rank: number;
        countryName: string;
        countryCode: string;
        countryPct: number;
        cities: Array<{
          name: string;
          pct: number;
        }>;
      }>;
    }
  ): Promise<any> {
    console.log('Sending TikTok demographics to API:', {
      endpoint: `/api/social-accounts/${socialAccountId}/tiktok-demographics`,
      data: demographics
    });
    
    return this.request(`/api/social-accounts/${socialAccountId}/tiktok-demographics`, {
      method: 'POST',
      body: JSON.stringify(demographics),
    });
  }

  async deleteSocialAccount(accountId: string): Promise<void> {
    await this.request(`/api/social-accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  // Get eligible actions for a social account with user action runs
  async getEligibleActions(socialAccountId: string): Promise<EligibleActionsResponse> {
    return this.request<EligibleActionsResponse>(`/api/social-accounts/${socialAccountId}/eligible-actions`);
  }

  // Start a new action run (with duplicate check)
  async startActionRun(data: {
    actionId: string;
    userId: string;
    socialAccountId: string;
  }): Promise<ActionRun> {
    return this.request<ActionRun>('/api/action-runs/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Combined flow for wallet connection
  async getOrCreateUserByWallet(walletAddress: string): Promise<User> {
    // First try to get existing user
    let user = await this.getUserByWallet(walletAddress);
    
    // If not found, create new user
    if (!user) {
      user = await this.createUser({ walletAddress });
    }
    
    return user;
  }

  // Action Run endpoints
  async createActionRun(data: CreateActionRunRequest): Promise<ActionRun> {
    return this.request<ActionRun>('/api/action-runs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateActionRun(
    actionRunId: string, 
    data: UpdateActionRunRequest
  ): Promise<ActionRun> {
    return this.request<ActionRun>(`/api/action-runs/${actionRunId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getActionRun(actionRunId: string): Promise<ActionRun> {
    return this.request<ActionRun>(`/api/action-runs/${actionRunId}`);
  }

  async getUserActionRuns(userId: string): Promise<ActionRun[]> {
    return this.request<ActionRun[]>(`/api/action-runs/user/${userId}`);
  }

  // Withdrawal endpoints
  async processWithdrawal(userId: string, amount: number): Promise<{
    success: boolean;
    withdrawalId: string;
    amount: number;
    status: string;
    message: string;
  }> {
    return this.request('/api/withdrawals', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        amount: Math.round(amount * 100), // Convert dollars to cents
      }),
    });
  }

  async getWithdrawalHistory(userId: string): Promise<any[]> {
    return this.request<any[]>(`/api/withdrawals/user/${userId}`);
  }
}

export const apiClient = new APIClient();