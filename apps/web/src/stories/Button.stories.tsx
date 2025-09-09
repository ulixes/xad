import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../components/ui/button'
import { Chrome, Github, Download, ArrowRight } from 'lucide-react'

const meta = {
  title: 'Landing Page/CTAButton',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'ghost', 'link', 'destructive', 'secondary'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Click me',
  },
}

export const ChromeInstall: Story = {
  args: {
    children: 'Install for Chrome',
    variant: 'secondary',
    size: 'lg',
    className: 'font-semibold shadow-md hover:shadow-lg transition-shadow',
  },
  render: (args) => (
    <Button {...args}>
      <Chrome className="mr-2 h-5 w-5"  />
      Install for Chrome
    </Button>
  ),
}

export const GithubLink: Story = {
  args: {
    children: 'View on GitHub',
    variant: 'outline',
    size: 'lg',
    className: 'font-semibold',
  },
  render: (args) => (
    <Button {...args}>
      <Github className="mr-2 h-5 w-5"  />
      View on GitHub
    </Button>
  ),
}

export const DownloadButton: Story = {
  args: {
    children: 'Download Now',
    variant: 'default',
  },
  render: (args) => (
    <Button {...args}>
      <Download className="mr-2 h-4 w-4"  />
      Download Now
    </Button>
  ),
}

export const GetStarted: Story = {
  args: {
    children: 'Get Started',
    size: 'lg',
  },
  render: (args) => (
    <Button {...args}>
      Get Started
      <ArrowRight className="ml-2 h-4 w-4"  />
    </Button>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
      <div className="flex gap-2 items-center">
        <Button size="lg">Large</Button>
        <Button size="default">Default</Button>
        <Button size="sm">Small</Button>
        <Button size="icon">
          <Chrome className="h-4 w-4"  />
        </Button>
      </div>
    </div>
  ),
}

export const HeroButtons: Story = {
  name: 'Hero Section Buttons',
  render: () => (
    <div className="bg-gradient-to-br from-primary to-accent p-8 rounded-lg">
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button 
          size="lg" 
          variant="secondary"
          className="font-semibold shadow-md hover:shadow-lg transition-shadow"
        >
          <Chrome className="mr-2 h-5 w-5"  />
          Install for Chrome
        </Button>
        
        <Button 
          size="lg" 
          variant="ghost"
          className="border-2 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/20 hover:border-primary-foreground/70 font-semibold"
        >
          <Github className="mr-2 h-5 w-5"  />
          View on GitHub
        </Button>
      </div>
    </div>
  ),
}