import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { useState } from 'react';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
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
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Account Settings</h3>
            <p className="text-muted-foreground">Make changes to your account here.</p>
          </div>
        </TabsContent>
        <TabsContent value="password">
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Password Settings</h3>
            <p className="text-muted-foreground">Change your password here.</p>
          </div>
        </TabsContent>
      </Tabs>
    );
  }
};

export const ThreeTabs: Story = {
  name: 'Three Tabs',
  render: () => {
    return (
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Overview</h3>
            <p className="text-muted-foreground">Your dashboard overview.</p>
          </div>
        </TabsContent>
        <TabsContent value="analytics">
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Analytics</h3>
            <p className="text-muted-foreground">View your analytics data.</p>
          </div>
        </TabsContent>
        <TabsContent value="reports">
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Reports</h3>
            <p className="text-muted-foreground">Generate and view reports.</p>
          </div>
        </TabsContent>
      </Tabs>
    );
  }
};

export const LogicOperatorTabs: Story = {
  name: 'Logic Operator (AND/OR)',
  render: () => {
    const [value, setValue] = useState('AND');
    
    return (
      <div className="space-y-4">
        <Tabs value={value} onValueChange={setValue} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="AND">AND</TabsTrigger>
            <TabsTrigger value="OR">OR</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="text-center text-muted-foreground">
          Selected: {value}
        </div>
      </div>
    );
  }
};

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const [activeTab, setActiveTab] = useState('tab1');
    
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('tab1')}
            className="px-3 py-1 border rounded"
          >
            Go to Tab 1
          </button>
          <button 
            onClick={() => setActiveTab('tab2')}
            className="px-3 py-1 border rounded"
          >
            Go to Tab 2
          </button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <div className="p-4 border rounded-lg">
              <p>Content for Tab 1</p>
            </div>
          </TabsContent>
          <TabsContent value="tab2">
            <div className="p-4 border rounded-lg">
              <p>Content for Tab 2</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
};