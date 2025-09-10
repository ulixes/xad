// Types for HTTP request/response extraction

export interface HTTPRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
  requestType: 'REST' | 'GraphQL' | 'Other';
}

export interface HTTPResponse {
  requestId: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
  responseTime: number;
}

export interface RequestResponsePair {
  request: HTTPRequest;
  response?: HTTPResponse;
}

export interface ExtractionSession {
  id: string;
  url: string;
  tabId: number;
  startTime: number;
  endTime?: number;
  status: 'active' | 'completed' | 'error';
  requests: RequestResponsePair[];
}

export interface ExtractionMessage {
  type: 
    | 'START_EXTRACTION' 
    | 'STOP_EXTRACTION' 
    | 'GET_SESSIONS' 
    | 'EXPORT_SESSION'
    | 'REQUEST_CAPTURED'
    | 'RESPONSE_CAPTURED'
    | 'SESSION_CREATED'
    | 'SESSION_STOPPED'
    | 'EXTRACTION_ERROR';
  sessionId?: string;
  url?: string;
  data?: any;
  error?: string;
}

export interface GraphQLRequest extends HTTPRequest {
  operationName?: string;
  query?: string;
  variables?: Record<string, any>;
}

export interface ExportFormat {
  format: 'json' | 'har' | 'curl';
  filename: string;
}