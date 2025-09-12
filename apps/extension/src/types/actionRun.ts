// Action run status enum matching the database
export enum ActionRunStatus {
  PENDING_VERIFICATION = 'pending_verification',
  DOM_VERIFIED = 'dom_verified',
  CDP_VERIFIED = 'cdp_verified',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAID = 'paid'
}

// Action run interface
export interface ActionRun {
  id: string;
  actionId: string;
  userId: string;
  socialAccountId: string;
  status: ActionRunStatus;
  proof: Record<string, any>;
  verificationData?: Record<string, any>;
  paymentData?: Record<string, any>;
  completedAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  brandId?: string;
  rewardAmount?: number;
  action?: {
    id: string;
    platform: string;
    actionType: string;
    target: string;
    title: string;
    description?: string;
    price: number;
  };
}

// Create action run request
export interface CreateActionRunRequest {
  actionId: string;
  userId: string;
  socialAccountId: string;
  brandId?: string;
  rewardAmount?: number;
}

// Update action run request
export interface UpdateActionRunRequest {
  status: ActionRunStatus;
  proof?: Record<string, any>;
  verificationData?: Record<string, any>;
  paymentData?: Record<string, any>;
  completedAt?: string;
  error?: string;
}

// DOM verification proof
export interface DOMVerificationProof {
  actionType: string;
  platform: string;
  targetUrl: string;
  timestamp: number;
  domState: {
    previousState?: string;
    newState?: string;
    elementFound: boolean;
    selector?: string;
  };
  userAgent: string;
  tabId?: number;
}

// CDP verification data
export interface CDPVerificationData {
  verified: boolean;
  verificationMethod: string;
  timestamp: number;
  apiResponse?: any;
  confidence?: number;
}