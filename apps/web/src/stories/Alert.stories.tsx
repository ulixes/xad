import type { Meta, StoryObj } from '@storybook/react-vite'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Terminal, AlertCircle, CheckCircle, Info } from 'lucide-react'

const meta = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
    },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Alert>
      <Terminal className="h-4 w-4" />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components and dependencies to your app using the cli.
      </AlertDescription>
    </Alert>
  ),
}

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again.
      </AlertDescription>
    </Alert>
  ),
}

export const Success: Story = {
  render: () => (
    <Alert className="border-green-500/50 text-green-700 [&>svg]:text-green-600">
      <CheckCircle className="h-4 w-4" />
      <AlertTitle>Success!</AlertTitle>
      <AlertDescription>
        Your campaign has been created successfully.
      </AlertDescription>
    </Alert>
  ),
}

export const Information: Story = {
  render: () => (
    <Alert className="border-blue-500/50 text-blue-700 [&>svg]:text-blue-600">
      <Info className="h-4 w-4" />
      <AlertTitle>Information</AlertTitle>
      <AlertDescription>
        This feature is currently in beta. Please report any issues.
      </AlertDescription>
    </Alert>
  ),
}

export const MinimumAmountWarning: Story = {
  name: 'Minimum Amount Warning',
  render: () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Minimum Amount Required</AlertTitle>
      <AlertDescription>
        Campaign total must be at least $50.00 to proceed with payment.
      </AlertDescription>
    </Alert>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="w-[500px] space-y-4">
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Default Alert</AlertTitle>
        <AlertDescription>
          This is a default alert with an icon and description.
        </AlertDescription>
      </Alert>
      
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Destructive Alert</AlertTitle>
        <AlertDescription>
          This is a destructive alert showing an error or warning.
        </AlertDescription>
      </Alert>
      
      <Alert className="border-green-500/50 text-green-700 [&>svg]:text-green-600">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Success Alert</AlertTitle>
        <AlertDescription>
          This is a success alert showing positive feedback.
        </AlertDescription>
      </Alert>
      
      <Alert className="border-blue-500/50 text-blue-700 [&>svg]:text-blue-600">
        <Info className="h-4 w-4" />
        <AlertTitle>Information Alert</AlertTitle>
        <AlertDescription>
          This is an informational alert providing helpful context.
        </AlertDescription>
      </Alert>
    </div>
  ),
}