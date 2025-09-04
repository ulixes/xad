# Components Documentation

Complete guide to all components in the Microtask Platform, organized by category.

## Component Categories

- [UI Components](#ui-components) - Base design system components
- [Authentication Components](#authentication-components) - Web3 wallet authentication
- [Task Components](#task-components) - Task management and workflow
- [Cashout Components](#cashout-components) - Rewards and payment processing

---

## UI Components

### Base Components

#### `Button` 
**Path**: `components/ui/button.tsx`

Standard button component with variants.

```tsx
<Button variant="default" size="md" onClick={handleClick}>
  Click Me
</Button>
```

**Props**:
- `variant`: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
- `size`: 'sm' | 'md' | 'lg' | 'icon'
- `asChild`: boolean - Render as child component

#### `Card`
**Path**: `components/ui/card.tsx`

Container component for content sections.

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer content</CardFooter>
</Card>
```

#### `Badge`
**Path**: `components/ui/badge.tsx`

Label component for status indicators.

```tsx
<Badge variant="default">New</Badge>
```

**Variants**: default, secondary, destructive, outline

#### `Alert`
**Path**: `components/ui/alert.tsx`

Alert message component.

```tsx
<Alert>
  <AlertTitle>Alert Title</AlertTitle>
  <AlertDescription>Alert message here</AlertDescription>
</Alert>
```

#### `Separator`
**Path**: `components/ui/separator.tsx`

Visual divider component.

```tsx
<Separator orientation="horizontal" />
```

#### `Tooltip`
**Path**: `components/ui/tooltip.tsx`

Hover tooltip component.

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Hover me</TooltipTrigger>
    <TooltipContent>Tooltip content</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Neo-Brutalism Components

#### `NeoButton`
**Path**: `components/ui/neo-button.tsx`

Neo-brutalism styled button with bold shadows.

```tsx
<NeoButton 
  variant="primary"
  size="lg"
  shadowSize="md"
  onClick={handleAction}
>
  Bold Action
</NeoButton>
```

**Features**:
- Hard drop shadows
- Bold borders
- Hover state animations
- Active state shadow reduction

#### `NeoCard`
**Path**: `components/ui/neo-card.tsx`

Neo-brutalism card with distinctive styling.

```tsx
<NeoCard shadowSize="lg" borderWidth="thick">
  <NeoCardHeader>
    <NeoCardTitle>Bold Title</NeoCardTitle>
  </NeoCardHeader>
  <NeoCardContent>Content</NeoCardContent>
</NeoCard>
```

**Features**:
- Thick black borders
- Hard shadows
- Bold color schemes
- Interactive hover states

---

## Authentication Components

### Components

#### `AuthView`
**Path**: `components/auth/components/AuthView.tsx`

Main authentication interface component.

```tsx
<AuthView 
  onLogin={handleLogin}
  isLoading={loading}
  error={error}
/>
```

**Features**:
- Wallet connection UI
- Loading states
- Error handling
- Multi-wallet support

#### `LoginButton`
**Path**: `components/auth/components/LoginButton.tsx`

Web3 wallet connection button.

```tsx
<LoginButton 
  onSuccess={handleLoginSuccess}
  onError={handleLoginError}
/>
```

#### `LogoutButton`
**Path**: `components/auth/components/LogoutButton.tsx`

Disconnect wallet button.

```tsx
<LogoutButton onLogout={handleLogout} />
```

#### `WalletDisplay`
**Path**: `components/auth/components/WalletDisplay.tsx`

Shows connected wallet information.

```tsx
<WalletDisplay 
  address="0x..."
  balance={1000}
  network="mainnet"
/>
```

#### `UserProfile`
**Path**: `components/auth/components/UserProfile.tsx`

User profile display component.

```tsx
<UserProfile 
  user={currentUser}
  showBalance={true}
/>
```

#### `AuthStatusIndicator`
**Path**: `components/auth/components/AuthStatusIndicator.tsx`

Visual indicator of authentication state.

```tsx
<AuthStatusIndicator 
  isAuthenticated={true}
  isConnecting={false}
/>
```

### Containers

#### `AuthContainer`
**Path**: `components/auth/containers/AuthContainer.tsx`

Authentication state management container.

```tsx
<AuthContainer>
  {({ isAuthenticated, user, login, logout }) => (
    // Render auth-dependent content
  )}
</AuthContainer>
```

**Provides**:
- Authentication state
- Login/logout methods
- User data
- Error handling

### Error Handling

#### `AuthErrorBoundary`
**Path**: `components/auth/errors/AuthErrorBoundary.tsx`

Error boundary for authentication failures.

```tsx
<AuthErrorBoundary fallback={<ErrorFallback />}>
  <AuthenticatedApp />
</AuthErrorBoundary>
```

---

## Task Components

### Task Views

#### `AvailableTasksView`
**Path**: `components/task/AvailableTasksView.tsx`

Displays list of available tasks.

```tsx
<AvailableTasksView 
  tasks={availableTasks}
  onClaim={handleClaimTask}
  isLoading={loading}
/>
```

**Features**:
- Task cards with rewards
- Platform indicators (Reddit/Twitter)
- Claim buttons
- Loading states

#### `ActiveTaskView`
**Path**: `components/task/ActiveTaskView.tsx`

Shows currently active task details.

```tsx
<ActiveTaskView 
  task={activeTask}
  onComplete={handleComplete}
  onCancel={handleCancel}
/>
```

**Features**:
- Task instructions
- Timer display
- Action buttons
- Progress tracking

#### `Proof`
**Path**: `components/task/Proof.tsx`

Task completion proof component.

```tsx
<Proof 
  taskId={taskId}
  proofData={proof}
  onSubmit={handleProofSubmit}
/>
```

### Task Containers

#### `TaskPanelContainer`
**Path**: `components/task/TaskPanelContainer.tsx`

Main task panel orchestrator.

```tsx
<TaskPanelContainer 
  userId={userId}
  onTaskComplete={handleTaskComplete}
/>
```

**Manages**:
- Task lifecycle
- State transitions
- API communications
- Error handling

#### `AvailableTasksContainer`
**Path**: `components/task/AvailableTasksContainer.tsx`

Container for available tasks list.

```tsx
<AvailableTasksContainer 
  filters={taskFilters}
  onTaskSelect={handleTaskSelect}
/>
```

#### `ActiveTaskContainer`
**Path**: `components/task/ActiveTaskContainer.tsx`

Active task state management.

```tsx
<ActiveTaskContainer 
  taskId={activeTaskId}
  onStatusChange={handleStatusChange}
/>
```

#### `TaskSubmissionContainer`
**Path**: `components/task/TaskSubmissionContainer.tsx`

Task submission workflow container.

```tsx
<TaskSubmissionContainer 
  task={completedTask}
  proof={taskProof}
  onSubmitSuccess={handleSuccess}
/>
```

---

## Cashout Components

#### `CashoutProgressCard`
**Path**: `components/cashout/CashoutProgressCard.tsx`

Displays cashout progress and earnings.

```tsx
<CashoutProgressCard 
  currentBalance={500}
  minimumCashout={1000}
  currency="points"
/>
```

**Features**:
- Progress bar
- Balance display
- Minimum threshold indicator
- Cashout button (when eligible)

#### `CashoutProgressContainer`
**Path**: `components/cashout/CashoutProgressContainer.tsx`

Manages cashout state and operations.

```tsx
<CashoutProgressContainer 
  userId={userId}
  onCashout={handleCashout}
/>
```

**Handles**:
- Balance fetching
- Cashout eligibility
- Transaction processing
- Error states

---

## Component Patterns

### Container/Presentational Pattern

All major features follow this pattern:

- **Container Components**: Handle logic, state, API calls
- **View Components**: Pure presentation, receive props
- **UI Components**: Reusable design system elements

### State Management

Components use different state strategies:

1. **Local State**: Component-specific UI state
2. **Context API**: Shared state (auth, theme)
3. **XState Machines**: Complex workflows (tasks, Reddit)

### Error Handling

Each feature domain includes:

- Error boundary components
- Fallback UI components
- Retry mechanisms
- User-friendly error messages

### Loading States

Standard loading patterns:

```tsx
if (isLoading) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} />
return <Content data={data} />
```

### Accessibility

All components include:

- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management

## Usage Examples

### Complete Task Flow

```tsx
function TaskWorkflow() {
  return (
    <AuthContainer>
      {({ isAuthenticated }) => 
        isAuthenticated ? (
          <TaskPanelContainer>
            <AvailableTasksView />
            <ActiveTaskView />
            <TaskSubmissionContainer />
          </TaskPanelContainer>
        ) : (
          <AuthView />
        )
      }
    </AuthContainer>
  )
}
```

### Custom Neo-Brutalism Card

```tsx
function FeatureCard({ title, description, action }) {
  return (
    <NeoCard shadowSize="lg" borderWidth="thick">
      <NeoCardHeader>
        <Badge variant="secondary">NEW</Badge>
        <NeoCardTitle>{title}</NeoCardTitle>
      </NeoCardHeader>
      <NeoCardContent>
        <p>{description}</p>
      </NeoCardContent>
      <NeoCardFooter>
        <NeoButton onClick={action}>
          Get Started
        </NeoButton>
      </NeoCardFooter>
    </NeoCard>
  )
}
```

## Component Development Guidelines

1. **TypeScript First**: All components must be fully typed
2. **Props Documentation**: Include JSDoc comments for props
3. **Storybook Stories**: Create stories for UI components (planned)
4. **Test Coverage**: Write E2E tests for critical paths
5. **Accessibility**: Follow WCAG 2.1 AA standards
6. **Performance**: Use React.memo for expensive renders
7. **Error Boundaries**: Wrap feature components in error boundaries