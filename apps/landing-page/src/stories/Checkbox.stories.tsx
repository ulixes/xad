import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { useState } from 'react';

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
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

export const Default: Story = {
  name: 'Default',
  render: () => {
    return (
      <div className="flex items-center gap-3">
        <Checkbox id="terms" />
        <Label htmlFor="terms">Accept terms and conditions</Label>
      </div>
    );
  }
};

export const WithDescription: Story = {
  name: 'With Description',
  render: () => {
    return (
      <div className="flex items-start gap-3">
        <Checkbox id="terms-2" defaultChecked />
        <div className="grid gap-2">
          <Label htmlFor="terms-2">Accept terms and conditions</Label>
          <p className="text-muted-foreground text-sm">
            By clicking this checkbox, you agree to the terms and conditions.
          </p>
        </div>
      </div>
    );
  }
};

export const Disabled: Story = {
  name: 'Disabled',
  render: () => {
    return (
      <div className="flex items-start gap-3">
        <Checkbox id="toggle" disabled />
        <Label htmlFor="toggle">Enable notifications</Label>
      </div>
    );
  }
};

export const StyledCard: Story = {
  name: 'Styled Card',
  render: () => {
    return (
      <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-primary has-[[aria-checked=true]]:bg-primary/10">
        <Checkbox
          id="toggle-2"
          defaultChecked
        />
        <div className="grid gap-1.5 font-normal">
          <p className="text-sm leading-none font-medium">
            Enable notifications
          </p>
          <p className="text-muted-foreground text-sm">
            You can enable or disable notifications at any time.
          </p>
        </div>
      </Label>
    );
  }
};

export const MultipleCheckboxes: Story = {
  name: 'Multiple Checkboxes',
  render: () => {
    const [notifications, setNotifications] = useState({
      email: true,
      sms: false,
      push: true,
    });
    
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Notification Preferences</Label>
          <p className="text-sm text-muted-foreground">Choose how you want to be notified.</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="email" 
              checked={notifications.email}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, email: checked as boolean }))
              }
            />
            <Label 
              htmlFor="email"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Email notifications
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="sms" 
              checked={notifications.sms}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, sms: checked as boolean }))
              }
            />
            <Label 
              htmlFor="sms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              SMS notifications
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="push" 
              checked={notifications.push}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, push: checked as boolean }))
              }
            />
            <Label 
              htmlFor="push"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Push notifications
            </Label>
          </div>
        </div>
      </div>
    );
  }
};

export const ClickableCard: Story = {
  name: 'Clickable Card',
  render: () => {
    const [checked, setChecked] = useState(false);
    
    return (
      <Label
        htmlFor="card-checkbox"
        className="flex cursor-pointer items-start space-x-3 rounded-lg border p-4 hover:bg-accent"
      >
        <Checkbox 
          id="card-checkbox" 
          checked={checked}
          onCheckedChange={(checkedState) => {
            if (typeof checkedState === 'boolean') {
              setChecked(checkedState);
            }
          }}
          className="mt-1"
        />
        <div className="space-y-1 leading-none">
          <div className="font-medium">Marketing emails</div>
          <div className="text-sm text-muted-foreground">
            Receive emails about new products, features, and more.
          </div>
        </div>
      </Label>
    );
  }
};

export const IndeterminateState: Story = {
  name: 'Indeterminate State',
  render: () => {
    const [checkedItems, setCheckedItems] = useState([true, false, false]);
    
    const allChecked = checkedItems.every(Boolean);
    const someChecked = checkedItems.some(Boolean) && !allChecked;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="select-all"
            checked={allChecked ? true : someChecked ? "indeterminate" : false}
            onCheckedChange={(checked) => {
              setCheckedItems([checked as boolean, checked as boolean, checked as boolean]);
            }}
          />
          <Label 
            htmlFor="select-all"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Select all
          </Label>
        </div>
        <div className="ml-6 space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="item-1"
              checked={checkedItems[0]}
              onCheckedChange={(checked) => {
                const newItems = [...checkedItems];
                newItems[0] = checked as boolean;
                setCheckedItems(newItems);
              }}
            />
            <Label 
              htmlFor="item-1"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Item 1
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="item-2"
              checked={checkedItems[1]}
              onCheckedChange={(checked) => {
                const newItems = [...checkedItems];
                newItems[1] = checked as boolean;
                setCheckedItems(newItems);
              }}
            />
            <Label 
              htmlFor="item-2"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Item 2
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="item-3"
              checked={checkedItems[2]}
              onCheckedChange={(checked) => {
                const newItems = [...checkedItems];
                newItems[2] = checked as boolean;
                setCheckedItems(newItems);
              }}
            />
            <Label 
              htmlFor="item-3"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Item 3
            </Label>
          </div>
        </div>
      </div>
    );
  }
};