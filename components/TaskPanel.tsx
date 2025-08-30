import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Clock, DollarSign, Tag, Hash } from 'lucide-react';

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

interface TaskPanelProps {
  taskData?: TaskData;
  isWaiting?: boolean;
  error?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function getPlatformVariant(platform: string): "default" | "secondary" | "destructive" | "outline" {
  const platformLower = platform?.toLowerCase() || '';
  if (platformLower.includes('reddit')) return 'destructive';
  if (platformLower.includes('twitter')) return 'default';
  if (platformLower.includes('farcaster')) return 'secondary';
  return 'outline';
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    dateStyle: 'short',
    timeStyle: 'medium'
  });
}

const WaitingState: React.FC<{ error?: string }> = ({ error }) => (
  <Card className="w-full">
    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-4xl mb-4">
        {error ? '⚠️' : '⏳'}
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {error ? 'Error' : 'Waiting for task...'}
      </h3>
      <p className="text-muted-foreground text-sm">
        {error || 'Start a task from the web app to see details here'}
      </p>
    </CardContent>
  </Card>
);

const TaskField: React.FC<{ 
  label: string; 
  children: React.ReactNode; 
  icon?: React.ReactNode; 
}> = ({ label, children, icon }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      {icon}
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
    </div>
    <div>{children}</div>
  </div>
);

export const TaskPanel: React.FC<TaskPanelProps> = ({ 
  taskData, 
  isWaiting = false, 
  error 
}) => {
  if (isWaiting || !taskData || error) {
    return <WaitingState error={error} />;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          Task Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Task ID */}
        {taskData.taskId && (
          <TaskField 
            label="Task ID" 
            icon={<Hash className="h-4 w-4" />}
          >
            <span className="font-mono text-sm">#{taskData.taskId}</span>
          </TaskField>
        )}

        {/* Payout Amount */}
        {taskData.payoutAmount && (
          <TaskField 
            label="Payout Amount" 
            icon={<DollarSign className="h-4 w-4" />}
          >
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(taskData.payoutAmount)}
            </span>
          </TaskField>
        )}

        {/* Platform */}
        {taskData.platform && (
          <TaskField 
            label="Platform" 
            icon={<Tag className="h-4 w-4" />}
          >
            <Badge variant={getPlatformVariant(taskData.platform)}>
              {taskData.platform}
            </Badge>
          </TaskField>
        )}

        {/* Category */}
        {taskData.category && (
          <TaskField label="Category">
            <Badge variant="outline">{taskData.category}</Badge>
          </TaskField>
        )}

        {/* Description */}
        {taskData.description && (
          <TaskField label="Description">
            <p className="text-sm leading-relaxed">{taskData.description}</p>
          </TaskField>
        )}

        {/* Separator before URL */}
        {taskData.url && <Separator />}

        {/* Task URL */}
        {taskData.url && (
          <TaskField 
            label="Task URL" 
            icon={<ExternalLink className="h-4 w-4" />}
          >
            <a 
              href={taskData.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm break-all"
            >
              {taskData.url}
            </a>
          </TaskField>
        )}

        {/* Proof Steps */}
        {taskData.proofSteps && taskData.proofSteps.length > 0 && (
          <>
            <Separator />
            <TaskField label="Proof Steps">
              <ol className="space-y-2 text-sm">
                {taskData.proofSteps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <span className="flex-1 leading-relaxed">
                      {typeof step === 'string' ? step : step.description || JSON.stringify(step)}
                    </span>
                  </li>
                ))}
              </ol>
            </TaskField>
          </>
        )}

        {/* Action Button */}
        {taskData.url && (
          <Button 
            className="w-full" 
            onClick={() => window.open(taskData.url, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Task Link
          </Button>
        )}

        {/* Timestamp */}
        {taskData.timestamp && (
          <>
            <Separator />
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Received: {formatTimestamp(taskData.timestamp)}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};