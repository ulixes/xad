import React, { useState, useEffect } from 'react';
import { Play, Square, Download, Trash2, ExternalLink } from 'lucide-react';
import { ExtractionSession, ExtractionMessage, ExportFormat } from '../../src/types/extraction';

interface AppState {
  currentSession: ExtractionSession | null;
  allSessions: ExtractionSession[];
  url: string;
  isExtracting: boolean;
}

export default function App() {
  const [state, setState] = useState<AppState>({
    currentSession: null,
    allSessions: [],
    url: '',
    isExtracting: false
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await sendMessage({ type: 'GET_SESSIONS' });
      if (response.type === 'SESSIONS_DATA') {
        setState(prev => ({ ...prev, allSessions: response.data }));
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const startExtraction = async () => {
    if (!state.url.trim()) return;

    setState(prev => ({ ...prev, isExtracting: true }));
    
    try {
      const response = await sendMessage({ 
        type: 'START_EXTRACTION', 
        url: state.url.trim() 
      });
      
      if (response.type === 'SESSION_CREATED') {
        const session: ExtractionSession = {
          id: response.data.sessionId,
          url: response.data.url,
          tabId: response.data.tabId,
          startTime: Date.now(),
          status: 'active',
          requests: []
        };
        
        setState(prev => ({
          ...prev,
          currentSession: session,
          allSessions: [...prev.allSessions, session],
          isExtracting: true
        }));
      } else if (response.type === 'EXTRACTION_ERROR') {
        alert(`Failed to start extraction: ${response.error}`);
        setState(prev => ({ ...prev, isExtracting: false }));
      }
    } catch (error) {
      console.error('Failed to start extraction:', error);
      setState(prev => ({ ...prev, isExtracting: false }));
    }
  };

  const stopExtraction = async () => {
    if (!state.currentSession) return;

    try {
      const response = await sendMessage({ 
        type: 'STOP_EXTRACTION', 
        sessionId: state.currentSession.id 
      });
      
      if (response.type === 'SESSION_STOPPED') {
        setState(prev => ({
          ...prev,
          currentSession: null,
          isExtracting: false
        }));
        
        // Reload sessions to get updated data
        loadSessions();
      }
    } catch (error) {
      console.error('Failed to stop extraction:', error);
    }
  };

  const exportSession = async (session: ExtractionSession, format: 'json' | 'har' | 'curl') => {
    const exportFormat: ExportFormat = {
      format,
      filename: `${session.id}.${format === 'har' ? 'har' : format === 'curl' ? 'sh' : 'json'}`
    };

    try {
      const response = await sendMessage({
        type: 'EXPORT_SESSION',
        sessionId: session.id,
        data: exportFormat
      });

      if (response.type === 'EXPORT_COMPLETE') {
        console.log('Export completed successfully');
      } else if (response.type === 'EXTRACTION_ERROR') {
        alert(`Export failed: ${response.error}`);
      }
    } catch (error) {
      console.error('Failed to export session:', error);
      alert('Export failed');
    }
  };

  const sendMessage = (message: ExtractionMessage): Promise<any> => {
    return new Promise((resolve) => {
      browser.runtime.sendMessage(message, resolve);
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (session: ExtractionSession) => {
    const endTime = session.endTime || Date.now();
    const duration = endTime - session.startTime;
    return `${Math.round(duration / 1000)}s`;
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white min-h-screen">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-gray-900">Request Extractor</h1>
        <p className="text-sm text-gray-600">Capture HTTP requests and responses</p>
      </div>

      {/* URL Input and Controls */}
      <div className="p-4 space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            Target URL
          </label>
          <input
            type="url"
            id="url"
            value={state.url}
            onChange={(e) => setState(prev => ({ ...prev, url: e.target.value }))}
            placeholder="https://example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={state.isExtracting}
          />
        </div>

        <div className="flex gap-2">
          {!state.isExtracting ? (
            <button
              onClick={startExtraction}
              disabled={!state.url.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Play size={16} />
              Start Extraction
            </button>
          ) : (
            <button
              onClick={stopExtraction}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <Square size={16} />
              Stop Extraction
            </button>
          )}
        </div>

        {/* Current Session Status */}
        {state.currentSession && (
          <div className="p-3 bg-blue-50 rounded-md">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Active Session</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {state.currentSession.url}
            </p>
            <p className="text-xs text-gray-500">
              Started: {formatTime(state.currentSession.startTime)}
            </p>
          </div>
        )}
      </div>

      {/* Sessions List */}
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Extraction Sessions</h2>
        
        {state.allSessions.length === 0 ? (
          <p className="text-gray-500 text-sm">No extraction sessions yet</p>
        ) : (
          <div className="space-y-3">
            {state.allSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onExport={exportSession}
                formatTime={formatTime}
                formatDuration={formatDuration}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface SessionCardProps {
  session: ExtractionSession;
  onExport: (session: ExtractionSession, format: 'json' | 'har' | 'curl') => void;
  formatTime: (timestamp: number) => string;
  formatDuration: (session: ExtractionSession) => string;
}

function SessionCard({ session, onExport, formatTime, formatDuration }: SessionCardProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const statusColor = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    error: 'bg-red-100 text-red-800'
  }[session.status];

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
              {session.status}
            </span>
            <span className="text-xs text-gray-500">
              {formatDuration(session)}
            </span>
          </div>
          
          <p className="text-sm font-medium text-gray-900 mt-1 truncate">
            {new URL(session.url).hostname}
          </p>
          
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
            <span>{formatTime(session.startTime)}</span>
            <span>{session.requests.length} requests</span>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => window.open(session.url, '_blank')}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Open URL"
          >
            <ExternalLink size={14} />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Export"
            >
              <Download size={14} />
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 top-6 bg-white border rounded-md shadow-lg z-10 min-w-[100px]">
                <button
                  onClick={() => {
                    onExport(session, 'json');
                    setShowExportMenu(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  JSON
                </button>
                <button
                  onClick={() => {
                    onExport(session, 'har');
                    setShowExportMenu(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  HAR
                </button>
                <button
                  onClick={() => {
                    onExport(session, 'curl');
                    setShowExportMenu(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  cURL
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {session.requests.length > 0 && (
        <div className="text-xs text-gray-600">
          <p>Latest: {session.requests[session.requests.length - 1]?.request.method} {new URL(session.requests[session.requests.length - 1]?.request.url).pathname}</p>
        </div>
      )}
    </div>
  );
}