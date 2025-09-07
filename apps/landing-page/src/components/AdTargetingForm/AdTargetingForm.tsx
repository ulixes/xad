import { useState } from 'react';
import type { TargetingRule, ConditionGroup as ConditionGroupType } from '../../types/zk-schemas';
import { schemaCategories, availableSchemas } from '../../types/zk-schemas';
import { ConditionGroup } from './ConditionGroup';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface AdTargetingFormProps {
  initialRule?: TargetingRule;
  onSave?: (rule: TargetingRule) => void;
  onCancel?: () => void;
}

export function AdTargetingForm({ initialRule, onSave, onCancel }: AdTargetingFormProps) {
  const [rule, setRule] = useState<TargetingRule>(
    initialRule || {
      id: `rule-${Date.now()}`,
      name: '',
      description: '',
      rootGroup: {
        id: `group-root`,
        operator: 'AND',
        conditions: []
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft'
    }
  );

  const [showSchemaPanel, setShowSchemaPanel] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...rule,
        updatedAt: new Date()
      });
    }
  };

  const handleUpdateRootGroup = (updatedGroup: ConditionGroupType) => {
    setRule({
      ...rule,
      rootGroup: updatedGroup
    });
  };

  const generateHumanReadable = (group: ConditionGroupType, depth = 0): string => {
    if (group.conditions.length === 0) return '';
    
    let result = '';
    group.conditions.forEach((cond, index) => {
      if ('schemaId' in cond) {
        const schema = availableSchemas.find(s => s.id === cond.schemaId);
        if (!schema) {
          result += 'Unknown condition';
        } else {
          let text = `${schema.displayName} ${cond.operator} ${cond.value}`;
          if (cond.params && schema.params) {
            const paramValues = schema.params.map(p => cond.params?.[p.name]).filter(Boolean);
            if (paramValues.length > 0) {
              text += ` (${paramValues.join(', ')})`;
            }
          }
          result += text;
        }
        
        // Add the logical operator if not the last condition
        if (index < group.conditions.length - 1) {
          result += ` ${cond.logicalOperator || 'AND'} `;
        }
      } else {
        // Nested group
        if (index > 0) result += ` ${group.operator} `;
        result += `(${generateHumanReadable(cond, depth + 1)})`;
      }
    });
    
    return result;
  };

  const filteredSchemas = availableSchemas.filter(schema => {
    const matchesCategory = !selectedCategory || schema.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      schema.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schema.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex gap-6">
      {/* Main Form */}
      <div className={`flex-1 space-y-6 ${showSchemaPanel ? 'mr-80' : ''}`}>
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle>Create Targeting Rule</CardTitle>
            <CardDescription>
              Define your audience using privacy-preserving zero-knowledge proofs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rule-name" className="text-base font-medium">Rule Name</Label>
                <Input
                  id="rule-name"
                  value={rule.name}
                  onChange={(e) => setRule({ ...rule, name: e.target.value })}
                  placeholder="e.g., Young Music Fans in USA"
                  className="text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rule-status" className="text-base font-medium">Status</Label>
                <Select 
                  value={rule.status} 
                  onValueChange={(value) => setRule({ ...rule, status: value as any })}
                >
                  <SelectTrigger id="rule-status" className="text-base cursor-pointer hover:bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft" className="cursor-pointer text-base">Draft</SelectItem>
                    <SelectItem value="active" className="cursor-pointer text-base">Active</SelectItem>
                    <SelectItem value="paused" className="cursor-pointer text-base">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rule-description" className="text-base font-medium">Description</Label>
              <Textarea
                id="rule-description"
                value={rule.description}
                onChange={(e) => setRule({ ...rule, description: e.target.value })}
                placeholder="Describe your target audience..."
                rows={2}
                className="text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Condition Builder */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Targeting Conditions</CardTitle>
                <CardDescription>
                  Build your audience using verified attributes
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSchemaPanel(!showSchemaPanel)}
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {showSchemaPanel ? 'Hide' : 'Show'} Schema Library
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ConditionGroup
              group={rule.rootGroup}
              onUpdate={handleUpdateRootGroup}
              isRoot={true}
            />
          </CardContent>
        </Card>

        {/* Preview */}
        {rule.rootGroup.conditions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rule Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-muted-foreground font-mono">
                {generateHumanReadable(rule.rootGroup) || 'No conditions defined'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={!rule.name || rule.rootGroup.conditions.length === 0}>
            Save Targeting Rule
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      {/* Schema Panel */}
      {showSchemaPanel && (
        <div className="fixed right-0 top-0 h-full w-80 bg-background border-l-2 border-border overflow-y-auto">
          <Card className="border-0 rounded-none shadow-none">
            <CardHeader className="sticky top-0 bg-background z-10 pb-3">
              <CardTitle className="text-lg">Schema Library</CardTitle>
              <CardDescription>
                Available attributes for targeting
              </CardDescription>
              
              <div className="space-y-3 pt-3">
                {/* Search */}
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search schemas..."
                  className="text-base"
                />
                
                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={!selectedCategory ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    All
                  </Button>
                  {schemaCategories.map(cat => (
                    <Button
                      key={cat.name}
                      variant={selectedCategory === cat.name ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat.name)}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Schema List */}
              <div className="space-y-2">
                {filteredSchemas.map(schema => (
                  <Card key={schema.id} className="hover:border-primary/50 transition-colors cursor-pointer hover:bg-muted/50">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-base">{schema.displayName}</span>
                            {schema.verified && (
                              <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">Verified</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{schema.description}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="px-2 py-0.5 bg-muted rounded">{schema.provider}</span>
                            <span className="text-muted-foreground">{schema.type}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}