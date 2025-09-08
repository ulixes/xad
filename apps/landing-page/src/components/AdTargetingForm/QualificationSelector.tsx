import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { allPlatformSchemas } from '../../types/platform-schemas';

interface QualificationSelectorProps {
  value: string;
  onChange: (schemaId: string) => void;
  className?: string;
  platform?: string;
}

export function QualificationSelector({ value, onChange, className, platform }: QualificationSelectorProps) {
  const selected = allPlatformSchemas.find(s => s.id === value);
  
  // Filter schemas
  const filteredSchemas = useMemo(() => {
    let filtered = allPlatformSchemas;
    
    // Filter by platform if provided
    if (platform) {
      filtered = filtered.filter(schema => 
        schema.platform.toLowerCase() === platform.toLowerCase()
      );
    }

    return filtered.sort((a, b) => 
      a.platform.localeCompare(b.platform) || a.displayName.localeCompare(b.displayName)
    );
  }, [platform]);


  const selectedLabel = selected 
    ? selected.displayName
    : 'Select a qualification';

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue>
          {selectedLabel}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[400px]">
        {filteredSchemas.map(schema => (
          <SelectItem 
            key={schema.id} 
            value={schema.id}
            className="py-2"
          >
            {schema.displayName}
          </SelectItem>
        ))}
        
        {filteredSchemas.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No qualifications found for this platform
          </div>
        )}
      </SelectContent>
    </Select>
  );
}