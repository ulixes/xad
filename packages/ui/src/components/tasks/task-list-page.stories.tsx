import type { Meta, StoryObj } from '@storybook/react'
import { TaskListPage, Task } from './task-list-page'

const meta = {
  title: 'Pages/TaskListPage',
  component: TaskListPage,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    accountHandle: {
      control: 'text',
      description: 'The handle of the connected account'
    },
    platform: {
      control: 'select',
      options: ['tiktok', 'instagram', 'x', 'reddit'],
      description: 'The social media platform'
    },
    tasks: {
      control: 'object',
      description: 'Array of tasks to display'
    },
    availableTasksCount: {
      control: 'number',
      description: 'Number of available tasks'
    },
    onStartTasks: {
      action: 'start-tasks-clicked',
      description: 'Called when Start Tasks button is clicked'
    },
    onTaskClick: {
      action: 'task-clicked',
      description: 'Called when a task is clicked'
    },
    onBack: {
      action: 'back-clicked',
      description: 'Called when the back button is clicked'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    }
  }
} satisfies Meta<typeof TaskListPage>

export default meta
type Story = StoryObj<typeof meta>

const tiktokTasks: Task[] = [
  { id: '1', type: 'like', status: 'completed', platform: 'tiktok', url: 'https://www.tiktok.com/@user/video/7234567890', payment: 0.25 },
  { id: '2', type: 'like', status: 'loading', platform: 'tiktok', url: 'https://www.tiktok.com/@creator/video/7234567891', payment: 0.25 },
  { id: '3', type: 'like', status: 'pending', platform: 'tiktok', url: 'https://www.tiktok.com/@trending/video/7234567892', payment: 0.25 },
  { id: '4', type: 'comment', status: 'pending', platform: 'tiktok', url: 'https://www.tiktok.com/@viral/video/7234567893', payment: 0.50 },
  { id: '5', type: 'share', status: 'pending', platform: 'tiktok', url: 'https://www.tiktok.com/@dance/video/7234567894', payment: 0.35 },
  { id: '6', type: 'follow', status: 'pending', platform: 'tiktok', url: 'https://www.tiktok.com/@newuser', payment: 0.40 },
]

const instagramTasks: Task[] = [
  { id: '1', type: 'like', status: 'completed', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123456/', payment: 0.25 },
  { id: '2', type: 'like', status: 'completed', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123457/', payment: 0.25 },
  { id: '3', type: 'like', status: 'pending', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123458/', payment: 0.25 },
  { id: '4', type: 'comment', status: 'pending', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123459/', payment: 0.50 },
  { id: '5', type: 'save', status: 'pending', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123460/', payment: 0.30 },
  { id: '6', type: 'follow', status: 'pending', platform: 'instagram', url: 'https://www.instagram.com/fashionista/', payment: 0.40 },
  { id: '7', type: 'like', status: 'pending', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123461/', payment: 0.25 },
]

const xTasks: Task[] = [
  { id: '1', type: 'like', status: 'completed', platform: 'x', url: 'https://x.com/user/status/1234567890', payment: 0.25 },
  { id: '2', type: 'like', status: 'pending', platform: 'x', url: 'https://x.com/tech/status/1234567891', payment: 0.25 },
  { id: '3', type: 'retweet', status: 'pending', platform: 'x', url: 'https://x.com/news/status/1234567892', payment: 0.35 },
  { id: '4', type: 'comment', status: 'pending', platform: 'x', url: 'https://x.com/sports/status/1234567893', payment: 0.50 },
  { id: '5', type: 'follow', status: 'pending', platform: 'x', url: 'https://x.com/techguru', payment: 0.40 },
]

const redditTasks: Task[] = [
  { id: '1', type: 'upvote', status: 'completed', platform: 'reddit', url: 'https://reddit.com/r/technology/comments/abc123', payment: 0.20 },
  { id: '2', type: 'upvote', status: 'pending', platform: 'reddit', url: 'https://reddit.com/r/programming/comments/def456', payment: 0.20 },
  { id: '3', type: 'comment', status: 'pending', platform: 'reddit', url: 'https://reddit.com/r/askreddit/comments/ghi789', payment: 0.50 },
  { id: '4', type: 'save', status: 'pending', platform: 'reddit', url: 'https://reddit.com/r/science/comments/jkl012', payment: 0.30 },
]

export const TikTokTasks: Story = {
  args: {
    accountHandle: 'creator123',
    platform: 'tiktok',
    tasks: tiktokTasks,
    availableTasksCount: 6,
    onStartTasks: () => {},
    onTaskClick: (taskId) => console.log('Task clicked:', taskId),
    onBack: () => console.log('Back clicked'),
  },
}

export const InstagramManyLikes: Story = {
  args: {
    accountHandle: 'photographer',
    platform: 'instagram',
    tasks: instagramTasks,
    availableTasksCount: 7,
    onStartTasks: () => {},
    onTaskClick: (taskId) => console.log('Task clicked:', taskId),
    onBack: () => console.log('Back clicked'),
  },
}

export const XTasks: Story = {
  args: {
    accountHandle: 'techwriter',
    platform: 'x',
    tasks: xTasks,
    availableTasksCount: 5,
    onStartTasks: () => {},
    onTaskClick: (taskId) => console.log('Task clicked:', taskId),
    onBack: () => console.log('Back clicked'),
  },
}

export const RedditTasks: Story = {
  args: {
    accountHandle: 'redditor42',
    platform: 'reddit',
    tasks: redditTasks,
    availableTasksCount: 4,
    onStartTasks: () => {},
    onTaskClick: (taskId) => console.log('Task clicked:', taskId),
    onBack: () => console.log('Back clicked'),
  },
}

export const MixedStates: Story = {
  args: {
    accountHandle: 'johndoe',
    platform: 'tiktok',
    tasks: [
      { id: '1', type: 'like', status: 'completed', platform: 'tiktok', url: 'https://www.tiktok.com/@user/video/7234567890', payment: 0.25 },
      { id: '2', type: 'like', status: 'loading', platform: 'tiktok', url: 'https://www.tiktok.com/@creator/video/7234567891', payment: 0.25 },
      { id: '3', type: 'like', status: 'error', platform: 'tiktok', url: 'https://www.tiktok.com/@trending/video/7234567892', payment: 0.25, errorMessage: 'Failed to like post. Please try again.' },
      { id: '4', type: 'comment', status: 'pending', platform: 'tiktok', url: 'https://www.tiktok.com/@viral/video/7234567893', payment: 0.50 },
    ],
    availableTasksCount: 4,
    onStartTasks: () => {},
    onTaskClick: (taskId) => console.log('Task clicked:', taskId),
    onBack: () => console.log('Back clicked'),
  },
}

export const AllCompleted: Story = {
  args: {
    accountHandle: 'successful_user',
    platform: 'instagram',
    tasks: [
      { id: '1', type: 'like', status: 'completed', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123456/', payment: 0.25 },
      { id: '2', type: 'like', status: 'completed', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123457/', payment: 0.25 },
      { id: '3', type: 'comment', status: 'completed', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123458/', payment: 0.50 },
      { id: '4', type: 'save', status: 'completed', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123459/', payment: 0.30 },
      { id: '5', type: 'follow', status: 'completed', platform: 'instagram', url: 'https://www.instagram.com/fashionista/', payment: 0.40 },
    ],
    availableTasksCount: 5,
    onStartTasks: () => {},
    onTaskClick: (taskId) => console.log('Task clicked:', taskId),
    onBack: () => console.log('Back clicked'),
  },
}

export const ManyLikeTasks: Story = {
  args: {
    accountHandle: 'liker_pro',
    platform: 'instagram',
    tasks: [
      { id: '1', type: 'like', status: 'completed', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123456/', payment: 0.25 },
      { id: '2', type: 'like', status: 'completed', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123457/', payment: 0.25 },
      { id: '3', type: 'like', status: 'loading', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123458/', payment: 0.25 },
      { id: '4', type: 'like', status: 'pending', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123459/', payment: 0.25 },
      { id: '5', type: 'like', status: 'pending', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123460/', payment: 0.25 },
      { id: '6', type: 'like', status: 'pending', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123461/', payment: 0.25 },
      { id: '7', type: 'like', status: 'pending', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123462/', payment: 0.25 },
      { id: '8', type: 'like', status: 'pending', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123463/', payment: 0.25 },
      { id: '9', type: 'like', status: 'pending', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123464/', payment: 0.25 },
      { id: '10', type: 'like', status: 'pending', platform: 'instagram', url: 'https://www.instagram.com/p/CxYZ123465/', payment: 0.25 },
    ],
    availableTasksCount: 10,
    onStartTasks: () => {},
    onTaskClick: (taskId) => console.log('Task clicked:', taskId),
    onBack: () => console.log('Back clicked'),
  },
}

export const WithErrors: Story = {
  args: {
    accountHandle: 'error_test',
    platform: 'reddit',
    tasks: [
      { id: '1', type: 'upvote', status: 'error', platform: 'reddit', url: 'https://reddit.com/r/technology/comments/abc123', payment: 0.20, errorMessage: 'Post not found' },
      { id: '2', type: 'comment', status: 'error', platform: 'reddit', url: 'https://reddit.com/r/askreddit/comments/def456', payment: 0.50, errorMessage: 'Comments are locked for this post' },
      { id: '3', type: 'save', status: 'pending', platform: 'reddit', url: 'https://reddit.com/r/science/comments/ghi789', payment: 0.30 },
    ],
    availableTasksCount: 3,
    onStartTasks: () => {},
    onTaskClick: (taskId) => console.log('Task clicked:', taskId),
    onBack: () => console.log('Back clicked'),
  },
}

export const EmptyState: Story = {
  args: {
    accountHandle: 'no_tasks_user',
    platform: 'tiktok',
    tasks: [],
    availableTasksCount: 0,
    onStartTasks: () => {},
    onTaskClick: (taskId) => console.log('Task clicked:', taskId),
    onBack: () => console.log('Back clicked'),
  },
}