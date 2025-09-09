import type { ConditionGroup as ConditionGroupType, ConditionBlock as ConditionBlockType, LogicalOperator } from '../../types/platform-schemas';
import { ConditionBlock } from './ConditionBlock';
import { Button } from '../ui/button';

interface ConditionGroupProps {
  group: ConditionGroupType;
  onUpdate: (group: ConditionGroupType) => void;
  onRemove?: () => void;
  isRoot?: boolean;
  depth?: number;
  platform?: string;
}

export function ConditionGroup({ 
  group, 
  onUpdate, 
  onRemove, 
  isRoot = false,
  depth = 0,
  platform 
}: ConditionGroupProps) {

  const handleAddCondition = () => {
    const newCondition: ConditionBlockType = {
      id: `cond-${Date.now()}`,
      schemaId: '',
      params: {},
      logicalOperator: 'AND' // Default to AND for connecting to next condition
    };
    onUpdate({
      ...group,
      conditions: [...group.conditions, newCondition]
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

  const bgColor = depth === 0 ? '' : depth === 1 ? 'bg-secondary border border-border' : 'bg-accent border border-border';

  return (
    <div className={`relative ${bgColor} ${!isRoot ? 'rounded-lg p-4' : ''}`}>
      {/* Header - only show for nested groups */}
      {!isRoot && (
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
            <span className="text-base font-medium bg-muted px-3 py-2 rounded">
              Nested Group
            </span>
          </div>

          {/* Remove Group Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      )}

      {/* Conditions */}
      <div className="space-y-2">
          {group.conditions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-base">
              No conditions yet.
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
                    platform={platform}
                  />
                  
                  {/* Individual AND/OR selector between conditions */}
                  {index < group.conditions.length - 1 && (
                    <div className="flex justify-center gap-2 my-4">
                      <Button
                        variant={condition.logicalOperator === 'AND' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleLogicalOperatorChange(index, 'AND')}
                        className="h-10 w-20 text-base"
                      >
                        AND
                      </Button>
                      <Button
                        variant={condition.logicalOperator === 'OR' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleLogicalOperatorChange(index, 'OR')}
                        className="h-10 w-20 text-base"
                      >
                        OR
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Nested group - use same AND/OR selector as conditions */}
                  <ConditionGroup
                    group={condition}
                    onUpdate={(updated) => handleUpdateCondition(index, updated)}
                    onRemove={() => handleRemoveCondition(index)}
                    depth={depth + 1}
                    platform={platform}
                  />
                  
                  {/* AND/OR selector after nested group if not last */}
                  {index < group.conditions.length - 1 && (
                    <div className="flex justify-center gap-2 my-4">
                      <Button
                        variant={group.operator === 'AND' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onUpdate({ ...group, operator: 'AND' })}
                        className="h-10 w-20 text-base"
                      >
                        AND
                      </Button>
                      <Button
                        variant={group.operator === 'OR' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onUpdate({ ...group, operator: 'OR' })}
                        className="h-10 w-20 text-base"
                      >
                        OR
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Add Button */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleAddCondition}
              variant="default"
              className="h-11 text-base"
            >
              Add Condition
            </Button>
          </div>
        </div>
    </div>
  );
}