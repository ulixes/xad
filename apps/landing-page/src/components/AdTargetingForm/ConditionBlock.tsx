import { useState, useEffect } from 'react';
import type { ConditionBlock as ConditionBlockType, ZKSchema } from '../../types/zk-schemas';
import { availableSchemas } from '../../types/zk-schemas';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card } from '../ui/card';

interface ConditionBlockProps {
  condition: ConditionBlockType;
  onUpdate: (condition: ConditionBlockType) => void;
  onRemove: () => void;
}

export function ConditionBlock({ condition, onUpdate, onRemove }: ConditionBlockProps) {
  const [schema, setSchema] = useState<ZKSchema | undefined>(
    availableSchemas.find(s => s.id === condition.schemaId)
  );

  useEffect(() => {
    const foundSchema = availableSchemas.find(s => s.id === condition.schemaId);
    setSchema(foundSchema);
  }, [condition.schemaId]);

  const handleSchemaChange = (schemaId: string) => {
    const newSchema = availableSchemas.find(s => s.id === schemaId);
    if (newSchema) {
      onUpdate({
        ...condition,
        schemaId,
        operator: newSchema.operators[0],
        value: newSchema.type === 'boolean' ? true : '',
        params: {}
      });
    }
  };

  const handleOperatorChange = (operator: any) => {
    onUpdate({ ...condition, operator });
  };

  const handleValueChange = (value: any) => {
    if (schema?.type === 'number') {
      onUpdate({ ...condition, value: Number(value) || 0 });
    } else {
      onUpdate({ ...condition, value });
    }
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

  // Group schemas by category for better organization
  const schemasByCategory = availableSchemas.reduce((acc, schema) => {
    if (!acc[schema.category]) {
      acc[schema.category] = [];
    }
    acc[schema.category].push(schema);
    return acc;
  }, {} as Record<string, ZKSchema[]>);

  return (
    <Card className="p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          {/* Schema Selection */}
          <div className="md:col-span-1 space-y-2">
            <Label htmlFor={`schema-${condition.id}`} className="text-base font-medium">Attribute</Label>
            <Select value={condition.schemaId} onValueChange={handleSchemaChange}>
              <SelectTrigger id={`schema-${condition.id}`} className="text-base cursor-pointer hover:bg-muted/50">
                <SelectValue placeholder="Select attribute...">
                  {schema && schema.displayName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(schemasByCategory).map(([category, schemas]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-base font-semibold text-muted-foreground">
                      {category}
                    </div>
                    {schemas.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="cursor-pointer">
                        <span className="flex items-center gap-2 text-base">
                          <span>{s.displayName}</span>
                          {s.verified && (
                            <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">Verified</span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operator Selection */}
          {schema && (
            <div className="md:col-span-1 space-y-2">
              <Label htmlFor={`operator-${condition.id}`} className="text-base font-medium">Operator</Label>
              <Select value={condition.operator} onValueChange={handleOperatorChange}>
                <SelectTrigger id={`operator-${condition.id}`} className="text-base cursor-pointer hover:bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {schema.operators.map((op) => (
                    <SelectItem key={op} value={op} className="cursor-pointer text-base">
                      {op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Value Input */}
          {schema && (
            <div className="md:col-span-1 space-y-2">
              <Label htmlFor={`value-${condition.id}`} className="text-base font-medium">Value</Label>
              {schema.type === 'boolean' ? (
                <Select 
                  value={condition.value?.toString()} 
                  onValueChange={(v) => handleValueChange(v === 'true')}
                >
                  <SelectTrigger id={`value-${condition.id}`} className="text-base cursor-pointer hover:bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true" className="cursor-pointer text-base">True</SelectItem>
                    <SelectItem value="false" className="cursor-pointer text-base">False</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`value-${condition.id}`}
                  type={schema.type === 'number' ? 'number' : 'text'}
                  value={condition.value || ''}
                  onChange={(e) => handleValueChange(e.target.value)}
                  placeholder={`Enter ${schema.type} value`}
                  className="text-base"
                />
              )}
            </div>
          )}

          {/* Parameters */}
          {schema?.params && schema.params.length > 0 && (
            <div className="md:col-span-1 space-y-2">
              {schema.params.map((param) => (
                <div key={param.name}>
                  <Label htmlFor={`param-${condition.id}-${param.name}`} className="text-base font-medium">
                    {param.name.replace('_', ' ').charAt(0).toUpperCase() + param.name.replace('_', ' ').slice(1)}
                  </Label>
                  <Input
                    id={`param-${condition.id}-${param.name}`}
                    type={param.type === 'number' ? 'number' : 'text'}
                    value={condition.params?.[param.name] || ''}
                    onChange={(e) => handleParamChange(param.name, e.target.value)}
                    placeholder={param.placeholder}
                    className="text-base"
                  />
                  {param.description && (
                    <p className="text-sm text-muted-foreground mt-1">{param.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-destructive hover:bg-destructive/10"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>
    </Card>
  );
}