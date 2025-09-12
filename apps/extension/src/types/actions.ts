export type ActionType = 'like' | 'comment' | 'follow' | 'share' | 'save';
export type Platform = 'instagram' | 'twitter' | 'youtube' | 'tiktok' | 'reddit';

export interface ActionRequest {
  actionId: string;
  actionType: ActionType;
  platform: Platform;
  targetUrl: string;
  accountHandle: string;
  metadata?: Record<string, any>;
}

export interface ActionResult {
  actionId: string;
  success: boolean;
  timestamp: number;
  details?: {
    previousState?: string;
    newState?: string;
    error?: string;
    fallback?: boolean;
    [key: string]: any;
  };
}

export interface TrackedAction {
  actionId: string;
  actionType: ActionType;
  platform: Platform;
  startTime: number;
  tabId?: number;
  status: 'pending' | 'tracking' | 'completed' | 'failed' | 'timeout';
}

export interface ActionMessage {
  type: 'TRACK_ACTION' | 'ACTION_COMPLETED' | 'CHECK_STATUS' | 'executeAction' | 'actionCompleted';
  payload?: any;
  actionId?: string;
  actionType?: ActionType;
  targetUrl?: string;
  success?: boolean;
  details?: any;
  timestamp?: number;
}