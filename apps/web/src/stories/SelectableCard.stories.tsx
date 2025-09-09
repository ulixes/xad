import type { Meta, StoryObj } from '@storybook/react';
import { SelectableCard } from '../components/ui/selectable-card';
import { useState } from 'react';

const meta: Meta<typeof SelectableCard> = {
  title: 'UI/SelectableCard',
  component: SelectableCard,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[400px] p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleCheckbox: Story = {
  name: 'Single Checkbox',
  render: () => {
    const [checked, setChecked] = useState(false);
    
    return (
      <SelectableCard
        id="example-1"
        checked={checked}
        onCheckedChange={setChecked}
        title="Enable notifications"
        description="Receive updates about your campaigns"
      />
    );
  }
};

export const SingleRadio: Story = {
  name: 'Single Radio',
  render: () => {
    const [checked, setChecked] = useState(false);
    
    return (
      <SelectableCard
        id="example-2"
        checked={checked}
        onCheckedChange={setChecked}
        title="Select this option"
        type="radio"
      />
    );
  }
};

export const MultipleActions: Story = {
  name: 'Multiple Actions',
  render: () => {
    const [actions, setActions] = useState({
      like: false,
      comment: false,
      share: true,
      follow: false
    });
    
    return (
      <div className="space-y-3">
        <SelectableCard
          id="action-like"
          checked={actions.like}
          onCheckedChange={(checked) => setActions(prev => ({ ...prev, like: checked }))}
          title="Like"
        />
        <SelectableCard
          id="action-comment"
          checked={actions.comment}
          onCheckedChange={(checked) => setActions(prev => ({ ...prev, comment: checked }))}
          title="Comment"
        />
        <SelectableCard
          id="action-share"
          checked={actions.share}
          onCheckedChange={(checked) => setActions(prev => ({ ...prev, share: checked }))}
          title="Share"
        />
        <SelectableCard
          id="action-follow"
          checked={actions.follow}
          onCheckedChange={(checked) => setActions(prev => ({ ...prev, follow: checked }))}
          title="Follow"
        />
      </div>
    );
  }
};

export const RadioGroup: Story = {
  name: 'Radio Group',
  render: () => {
    const [selected, setSelected] = useState('starter');
    
    const plans = [
      { id: 'starter', title: 'Starter Plan', description: 'Perfect for small businesses' },
      { id: 'pro', title: 'Pro Plan', description: 'More features and storage' },
      { id: 'enterprise', title: 'Enterprise', description: 'Custom solutions for large teams' }
    ];
    
    return (
      <div className="space-y-3">
        {plans.map(plan => (
          <SelectableCard
            key={plan.id}
            id={plan.id}
            checked={selected === plan.id}
            onCheckedChange={() => setSelected(plan.id)}
            title={plan.title}
            description={plan.description}
            type="radio"
          />
        ))}
      </div>
    );
  }
};

export const Disabled: Story = {
  name: 'Disabled State',
  render: () => {
    return (
      <div className="space-y-3">
        <SelectableCard
          id="disabled-unchecked"
          checked={false}
          onCheckedChange={() => {}}
          title="Disabled unchecked"
          description="This option is not available"
          disabled
        />
        <SelectableCard
          id="disabled-checked"
          checked={true}
          onCheckedChange={() => {}}
          title="Disabled checked"
          description="This option is locked"
          disabled
        />
      </div>
    );
  }
};

export const WithCustomContent: Story = {
  name: 'With Custom Content',
  render: () => {
    const [checked, setChecked] = useState(true);
    
    return (
      <SelectableCard
        id="custom"
        checked={checked}
        onCheckedChange={setChecked}
        title="Premium Feature"
      >
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">PRO</span>
          <span className="text-xs text-muted-foreground">$10/month</span>
        </div>
      </SelectableCard>
    );
  }
};