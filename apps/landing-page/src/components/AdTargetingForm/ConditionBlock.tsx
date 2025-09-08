import { useState, useEffect } from 'react';
import type { ConditionBlock as ConditionBlockType, PlatformSchema, OperatorType } from '../../types/platform-schemas';
import { allPlatformSchemas } from '../../types/platform-schemas';
import { QualificationSelector } from './QualificationSelector';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface ConditionBlockProps {
  condition: ConditionBlockType;
  onUpdate: (condition: ConditionBlockType) => void;
  onRemove: () => void;
  platform?: string;
}

export function ConditionBlock({ condition, onUpdate, onRemove, platform }: ConditionBlockProps) {
  const [schema, setSchema] = useState<PlatformSchema | undefined>(
    allPlatformSchemas.find(s => s.id === condition.schemaId)
  );

  useEffect(() => {
    const foundSchema = allPlatformSchemas.find(s => s.id === condition.schemaId);
    setSchema(foundSchema);
  }, [condition.schemaId]);

  const handleSchemaChange = (schemaId: string) => {
    const newSchema = allPlatformSchemas.find(s => s.id === schemaId);
    if (newSchema) {
      onUpdate({
        ...condition,
        schemaId,
        operator: newSchema.operators[0], // Set default operator
        value: newSchema.type === 'action' ? true : undefined, // Auto-set value for actions
        params: {}
      });
    }
  };

  const handleOperatorChange = (operator: OperatorType) => {
    onUpdate({
      ...condition,
      operator
    });
  };

  const handleValueChange = (value: any) => {
    onUpdate({
      ...condition,
      value
    });
  };

  const handleParamChange = (paramName: string, value: any) => {
    onUpdate({
      ...condition,
      params: {
        ...condition.params,
        [paramName]: value
      }
    });
  };

  const renderValueInput = () => {
    if (!schema || !condition.operator) return null;

    // Skip value input for action type (can_perform)
    if (schema.type === 'action') {
      return null;
    }

    // Skip value input for boolean operators
    if (schema.type === 'boolean') {
      return (
        <Select
          value={condition.value?.toString() || ''}
          onValueChange={(v) => handleValueChange(v === 'true')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    // Skip value for achievement operators that don't need it
    if (schema.type === 'achievement' && condition.operator === 'has_achievement') {
      return null;
    }

    // Regular input for other types
    return (
      <Input
        type={schema.type === 'number' ? 'number' : 'text'}
        value={condition.value || ''}
        onChange={(e) => handleValueChange(e.target.value)}
        placeholder={`Enter ${schema.type} value`}
        className="text-base h-11"
      />
    );
  };

  return (
    <div className="relative p-4 rounded-lg bg-card border border-border space-y-3">
      {/* Remove Button - Top Right */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Button>
      
      {/* Platform & Qualification Selection */}
      <div className="space-y-2 mb-1">
        <Label className="text-base font-medium">Requirement</Label>
        <QualificationSelector
          value={condition.schemaId}
          onChange={handleSchemaChange}
          className="w-full"
          platform={platform}
        />
      </div>

      {schema && (
        <>
          {/* Operator Selection - only show if more than one operator */}
          {schema.operators.length > 1 ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-base font-medium">Operator</Label>
                <Select
                  value={condition.operator}
                  onValueChange={handleOperatorChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {schema.operators.map(op => (
                      <SelectItem key={op} value={op}>
                        {op}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value Input */}
              {renderValueInput() && (
                <div className="space-y-2">
                  <Label className="text-base font-medium">Value</Label>
                  {renderValueInput()}
                </div>
              )}
            </div>
          ) : (
            /* Single operator or action type - show value input if needed */
            renderValueInput() && (
              <div className="space-y-2">
                <Label className="text-base font-medium">Value</Label>
                {renderValueInput()}
              </div>
            )
          )}

          {/* Parameters (e.g., artist name, achievement tier) */}
          {schema.params && schema.params.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border">
              {schema.params.map((param) => (
                <div key={param.name} className="space-y-2">
                  <Label className="text-base font-medium">
                    {param.name.replace(/_/g, ' ').split(' ').map(w => 
                      w.charAt(0).toUpperCase() + w.slice(1)
                    ).join(' ')}
                    {param.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  
                  {param.options ? (
                    <Select
                      value={condition.params?.[param.name] || ''}
                      onValueChange={(v) => handleParamChange(param.name, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={param.placeholder || 'Select option'} />
                      </SelectTrigger>
                      <SelectContent>
                        {param.options.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={param.type === 'number' ? 'number' : 'text'}
                      value={condition.params?.[param.name] || ''}
                      onChange={(e) => handleParamChange(param.name, e.target.value)}
                      placeholder={param.placeholder}
                      className="text-base h-11"
                    />
                  )}
                  
                </div>
              ))}
            </div>
          )}

        </>
      )}
    </div>
  );
}