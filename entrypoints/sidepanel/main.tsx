import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { TaskPanel } from '@/components/TaskPanel';
import '../../src/styles/globals.css';

interface TaskData {
  taskId?: string | number;
  url?: string;
  platform?: string;
  description?: string;
  payoutAmount?: number;
  category?: string;
  timestamp?: number;
  proofSteps?: any[];
  [key: string]: any;
}

const SidePanelApp: React.FC = () => {
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [isWaiting, setIsWaiting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for messages from background script
    const messageListener = (message: any, sender: any, sendResponse: Function) => {
      console.log('Side panel received message:', message);

      try {
        // Handle task data from external app (forwarded by background)
        if (message.from === 'background' && message.taskData) {
          setTaskData(message.taskData);
          setIsWaiting(false);
          setError(null);
          sendResponse({ success: true, message: 'Task displayed' });
        }
        // Handle direct task data
        else if (message.action === 'displayTask') {
          setTaskData(message);
          setIsWaiting(false);
          setError(null);
          sendResponse({ success: true, message: 'Task displayed' });
        }
        // Handle other action types that might contain task data
        else if (message.taskId || message.url || message.description) {
          setTaskData(message);
          setIsWaiting(false);
          setError(null);
          sendResponse({ success: true, message: 'Task displayed' });
        }
      } catch (err) {
        console.error('Error handling message:', err);
        setError('Failed to process task data');
        sendResponse({ success: false, error: 'Failed to process task data' });
      }
    };

    // Add message listener
    if (typeof browser !== 'undefined' && browser.runtime?.onMessage) {
      browser.runtime.onMessage.addListener(messageListener);
    }

    // Check for any stored task data on load
    const loadStoredTask = async () => {
      try {
        if (typeof browser !== 'undefined' && browser.storage?.local) {
          const result = await browser.storage.local.get('currentTask');
          if (result.currentTask) {
            setTaskData(result.currentTask);
            setIsWaiting(false);
          } else {
            setIsWaiting(true);
          }
        } else {
          setIsWaiting(true);
        }
      } catch (err) {
        console.error('Error loading stored task:', err);
        setIsWaiting(true);
      }
    };

    loadStoredTask();

    // Cleanup
    return () => {
      if (typeof browser !== 'undefined' && browser.runtime?.onMessage) {
        browser.runtime.onMessage.removeListener(messageListener);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background p-4">
      <TaskPanel 
        taskData={taskData || undefined}
        isWaiting={isWaiting}
        error={error || undefined}
      />
    </div>
  );
};

// Initialize React app
const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<SidePanelApp />);
} else {
  console.error('Could not find app container');
}