export interface NormalizedUser {
  id: string;
  name?: string;
  handle?: string;
  avatar?: string;
  verified?: boolean;
  followers?: number;
  following?: number;
  createdAt?: string;
}

export interface ProofConfig {
  type: string;
  platform: string;
  contentType: string;
  urlRegex: RegExp;
  context: {
    endpointIdentifier: string;
    parser: (data: any) => NormalizedUser;
  };
  action: {
    endpointIdentifier: string;
    parser: (data: any) => any[];
  };
}

export interface ProofSession {
  sessionId: string;
  proofType: string;
  config: ProofConfig;
  targetUrl?: string;
  contextData: NormalizedUser | null;
  actionData: any[] | null;
  status: 'waiting_for_navigation' | 'capturing_context' | 'waiting_for_action' | 'completed' | 'error';
  timestamp: number;
}

export type ProofEvent = 
  | { type: 'START_PROOF_SESSION'; sessionId: string; proofType: string; targetUrl?: string }
  | { type: 'NAVIGATION_DETECTED'; sessionId: string; url: string }
  | { type: 'PROOF_DATA_EXTRACTED'; sessionId: string; dataType: 'context' | 'action'; data: any; isComplete: boolean }
  | { type: 'PROOF_COMPLETED'; sessionId: string; proof: CompletedProof }
  | { type: 'PROOF_ERROR'; sessionId: string; error: string }
  | { type: 'PROOF_TIMEOUT'; sessionId: string };

export interface CompletedProof {
  type: string;
  platform: string;
  contentType: string;
  context: NormalizedUser;
  action: any[];
  timestamp: number;
  sessionId: string;
}

export interface BackgroundEvent {
  type: 'BACKGROUND_EVENT';
  eventType: string;
  payload: any;
  timestamp: number;
}