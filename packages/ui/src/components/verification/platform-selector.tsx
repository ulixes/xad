import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PLATFORM_CONFIGS } from '../../config/platform-configs';
import { Platform, ContentType } from '../../types/proof-config';
import { cn } from '@/lib/utils';

interface PlatformSelectorProps {
  selectedPlatform?: Platform;
  selectedContentType?: ContentType;
  onPlatformSelect: (platform: Platform) => void;
  onContentTypeSelect: (contentType: ContentType) => void;
  onStartVerification: () => void;
  className?: string;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatform,
  selectedContentType,
  onPlatformSelect,
  onContentTypeSelect,
  onStartVerification,
  className
}) => {
  const selectedConfig = selectedPlatform 
    ? PLATFORM_CONFIGS.find(config => config.platform === selectedPlatform)
    : null;

  return (
    <div className={cn("w-full max-w-2xl mx-auto space-y-6", className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Choose Platform & Action</h2>
        <p className="text-muted-foreground">
          Select the platform and type of interaction you want to verify
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {PLATFORM_CONFIGS.map((config) => {
          const Icon = config.icon;
          const isSelected = selectedPlatform === config.platform;
          
          return (
            <Card
              key={config.platform}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected && "ring-2 ring-primary"
              )}
              onClick={() => onPlatformSelect(config.platform)}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Icon 
                  size={32} 
                  style={{ color: config.color }} 
                  weight="fill"
                />
                <h3 className="font-medium mt-2">{config.displayName}</h3>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <selectedConfig.icon 
                size={20} 
                style={{ color: selectedConfig.color }} 
                weight="fill"
              />
              {selectedConfig.displayName} Actions
            </CardTitle>
            <CardDescription>
              Choose the type of interaction to verify
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedConfig.contentTypes.map((contentType) => {
              const Icon = contentType.icon;
              const isSelected = selectedContentType === contentType.type;
              
              return (
                <div
                  key={contentType.type}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent",
                    isSelected && "bg-accent border-primary",
                    !contentType.available && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => contentType.available && onContentTypeSelect(contentType.type)}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <div>
                      <p className="font-medium">{contentType.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {contentType.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!contentType.available && (
                      <Badge variant="secondary">Coming Soon</Badge>
                    )}
                    {isSelected && (
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {selectedPlatform && selectedContentType && (
        <div className="flex justify-center">
          <Button onClick={onStartVerification} size="lg">
            Start Verification
          </Button>
        </div>
      )}
    </div>
  );
};