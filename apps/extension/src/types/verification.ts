export interface VerificationContext {
  selectedPlatform: string | null;
  selectedContentType: string | null;
  targetId: string | null;
  activeSessionId: string | null;
  proofConfig: any | null;
  contextData: any | null;
  actionData: any | null;
  completedProof: CompletedProof | null;
  error: string | null;
}

export interface CompletedProof {
  type: string;
  platform: string;
  contentType: string;
  context: any;
  action: any[];
  timestamp: number;
  sessionId: string;
}

export type VerificationEvent = 
  | { type: 'SELECT_PLATFORM'; platform: string }
  | { type: 'SELECT_CONTENT_TYPE'; contentType: string }
  | { type: 'START_VERIFICATION'; platform: string; contentType: string; targetId: string }
  | { type: 'BACK_TO_PLATFORM_SELECTION' }
  | { type: 'BACK_TO_CONTENT_SELECTION' }
  | { type: 'SESSION_STARTED' }
  | { type: 'SESSION_ERROR'; error: string }
  | { type: 'NAVIGATION_DETECTED'; sessionId: string; url: string }
  | { type: 'PROOF_DATA_EXTRACTED'; sessionId: string; dataType: 'context' | 'action'; data: any; isComplete: boolean }
  | { type: 'PROOF_COMPLETED'; sessionId: string; proof: CompletedProof }
  | { type: 'PROOF_ERROR'; sessionId: string; error: string }
  | { type: 'PROOF_TIMEOUT'; sessionId: string }
  | { type: 'RETRY' }
  | { type: 'RESET' };

export enum VerificationState {
  IDLE = 'idle',
  PLATFORM_SELECTION = 'platform_selection',
  CONTENT_SELECTION = 'content_selection',
  STARTING_SESSION = 'starting_session',
  WAITING_FOR_NAVIGATION = 'waiting_for_navigation',
  CAPTURING_DATA = 'capturing_data',
  SHOWING_RESULTS = 'showing_results',
  COMPLETED = 'completed',
  ERROR = 'error'
}