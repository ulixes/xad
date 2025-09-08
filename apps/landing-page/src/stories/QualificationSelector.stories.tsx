import type { Meta, StoryObj } from '@storybook/react';
import { QualificationSelector } from '../components/AdTargetingForm/QualificationSelector';
import { useState } from 'react';

const meta: Meta<typeof QualificationSelector> = {
  title: 'ZK Advertising/QualificationSelector',
  component: QualificationSelector,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[600px] p-8 bg-background">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ServiceGrid: Story = {
  name: 'Service Selection Grid',
  render: () => {
    const [value, setValue] = useState('');
    return (
      <QualificationSelector 
        value={value}
        onChange={setValue}
      />
    );
  }
};

export const WithSelectedService: Story = {
  name: 'Service Qualifications View',
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Click on Spotify to see its qualifications
        </div>
        <QualificationSelector 
          value={value}
          onChange={setValue}
        />
        {value && (
          <div className="mt-4 p-3 bg-muted rounded">
            <div className="text-sm">Selected: {value}</div>
          </div>
        )}
      </div>
    );
  }
};

export const InFormContext: Story = {
  name: 'In Form Context',
  render: () => {
    const [value, setValue] = useState('');
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Add Targeting Condition</h3>
          <QualificationSelector 
            value={value}
            onChange={setValue}
          />
        </div>
      </div>
    );
  }
};