import { useState } from 'react';
import type { ConditionGroup as ConditionGroupType, ConditionBlock as ConditionBlockType, LogicalOperator } from '../../types/zk-schemas';
import { ConditionBlock } from './ConditionBlock';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface ConditionGroupProps {
  group: ConditionGroupType;
  onUpdate: (group: ConditionGroupType) => void;
  onRemove?: () => void;
  isRoot?: boolean;
  depth?: number;
}

export function ConditionGroup({ 
  group, 
  onUpdate, 
  onRemove, 
  isRoot = false,
  depth = 0 
}: ConditionGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleAddCondition = () => {
    const newCondition: ConditionBlockType = {
      id: `cond-${Date.now()}`,
      schemaId: '',
      operator: '=',
      value: '',
      params: {},
      logicalOperator: 'AND' // Default to AND for connecting to next condition
    };
    onUpdate({
      ...group,
      conditions: [...group.conditions, newCondition]
    });
  };

  const handleAddGroup = () => {
    const newGroup: ConditionGroupType = {
      id: `group-${Date.now()}`,
      operator: 'AND',
      conditions: []
    };
    onUpdate({
      ...group,
      conditions: [...group.conditions, newGroup]
    });
  };

  const handleUpdateCondition = (index: number, updatedCondition: ConditionBlockType | ConditionGroupType) => {
    const newConditions = [...group.conditions];
    newConditions[index] = updatedCondition;
    onUpdate({ ...group, conditions: newConditions });
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = group.conditions.filter((_, i) => i !== index);
    onUpdate({ ...group, conditions: newConditions });
  };

  const handleLogicalOperatorChange = (index: number, operator: LogicalOperator) => {
    if ('schemaId' in group.conditions[index]) {
      const newConditions = [...group.conditions];
      (newConditions[index] as ConditionBlockType).logicalOperator = operator;
      onUpdate({ ...group, conditions: newConditions });
    }
  };

  const borderColor = depth === 0 ? 'border-primary/30' : depth === 1 ? 'border-secondary/30' : 'border-muted/30';
  const bgColor = depth === 0 ? 'bg-background' : depth === 1 ? 'bg-muted/5' : 'bg-muted/10';

  return (
    <div className={`relative p-4 rounded-lg border-2 ${borderColor} ${bgColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Collapse Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg 
              className={`h-5 w-5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <span className="text-base text-muted-foreground">
            {group.conditions.length} condition{group.conditions.length !== 1 ? 's' : ''}
          </span>

          {!isRoot && depth > 0 && (
            <span className="text-sm bg-muted px-2 py-1 rounded">
              Nested Group
            </span>
          )}
        </div>

        {/* Remove Group Button */}
        {!isRoot && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-destructive hover:bg-destructive/10"
          >
            Remove Group
          </Button>
        )}
      </div>

      {/* Conditions */}
      {isExpanded && (
        <div className="space-y-2">
          {group.conditions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-base">
              No conditions yet. Add a condition to get started.
            </div>
          )}

          {group.conditions.map((condition, index) => (
            <div key={condition.id}>
              {'schemaId' in condition ? (
                <>
                  <ConditionBlock
                    condition={condition}
                    onUpdate={(updated) => handleUpdateCondition(index, updated)}
                    onRemove={() => handleRemoveCondition(index)}
                  />
                  
                  {/* Individual AND/OR selector between conditions */}
                  {index < group.conditions.length - 1 && (
                    <div className="flex items-center justify-center py-3">
                      <Select 
                        value={condition.logicalOperator || 'AND'} 
                        onValueChange={(value) => handleLogicalOperatorChange(index, value as LogicalOperator)}
                      >
                        <SelectTrigger className="w-28 h-10 text-base cursor-pointer hover:bg-muted/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND" className="cursor-pointer text-base">AND</SelectItem>
                          <SelectItem value="OR" className="cursor-pointer text-base">OR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Nested group with operator before it */}
                  {index > 0 && (
                    <div className="flex items-center justify-center py-2">
                      <span className="text-sm font-medium text-muted-foreground px-3 py-1 bg-muted rounded-full">
                        {group.operator}
                      </span>
                    </div>
                  )}
                  <ConditionGroup
                    group={condition}
                    onUpdate={(updated) => handleUpdateCondition(index, updated)}
                    onRemove={() => handleRemoveCondition(index)}
                    depth={depth + 1}
                  />
                </>
              )}
            </div>
          ))}

          {/* Add Buttons */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCondition}
              className="border-dashed"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Condition
            </Button>
            
            {depth < 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddGroup}
                className="border-dashed"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Add Group (Advanced)
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}