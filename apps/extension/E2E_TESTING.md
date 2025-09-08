# E2E Testing Documentation

## Overview

This extension uses Playwright for end-to-end testing, following industry best practices for browser extension testing. The testing framework ensures UI components correctly integrate with the state layer without directly testing state management logic.

## Architecture

```
e2e/
├── fixtures/
│   └── extension-test.ts      # Custom Playwright fixture for extension testing
├── pages/
│   └── SidePanelPage.ts      # Page Object Model for side panel
├── auth.spec.ts              # Authentication flow tests
├── wallet.spec.ts            # Wallet management tests
└── user-journey.spec.ts      # Complete user journey tests
```

## Testing Philosophy

Following the principles from the Microsoft Engineering Playbook and practical E2E testing guides:

1. **UI Integration Focus**: Tests verify that UI components correctly respond to state changes
2. **Page Object Model**: Abstracts UI interactions for maintainability
3. **User Journey Testing**: Tests complete workflows from user perspective
4. **Error Recovery**: Validates graceful error handling and recovery flows
5. **State Persistence**: Ensures state correctly persists across sessions

## Key Features

### Custom Extension Fixture

The `ExtensionFixture` class provides:
- Extension loading in Chromium
- Side panel access
- Storage management
- Background service worker access

### Page Object Model

`SidePanelPage` encapsulates:
- Element selectors with data-testid attributes
- Common user actions (login, logout, createWallet)
- State verification methods
- Wait strategies for async operations

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Build extension
npm run build
```

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (recommended for debugging)
npm run test:e2e:ui

# Debug specific test
npm run test:e2e:debug auth.spec.ts

# View test report
npm run test:e2e:report
```

## Test Scenarios

### 1. Authentication Tests (`auth.spec.ts`)

- Initial unauthenticated state
- Login flow with loading states
- Error handling and retry mechanism
- Logout flow
- State persistence across sessions

### 2. Wallet Management Tests (`wallet.spec.ts`)

- Wallet creation flow
- Multiple wallet management
- Loading states during creation
- Error handling for wallet operations
- Wallet persistence

### 3. User Journey Tests (`user-journey.spec.ts`)

- Complete authentication to wallet creation flow
- Error recovery throughout journey
- State transitions and persistence
- End-to-end user workflow validation

## Best Practices Implemented

### 1. Test Isolation
- Each test starts with cleared storage
- Tests don't depend on each other
- Mocked services for predictable behavior

### 2. Waiting Strategies
- Explicit waits for UI elements
- Network idle for page loads
- Custom wait functions for state changes

### 3. Error Handling
- Tests verify error states
- Retry mechanisms tested
- Graceful degradation validated

### 4. Maintainability
- Page Object Model for UI abstraction
- Reusable fixtures and helpers
- Clear test descriptions and assertions

## Mocking Strategy

Tests use controlled mocks for:
- `PrivyService`: Authentication and wallet operations
- Chrome Storage API: State persistence
- Network responses: Simulated delays and failures

## CI/CD Integration

The Playwright configuration supports CI environments:

```typescript
{
  forbidOnly: !!process.env.CI,  // Prevent .only in CI
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
  workers: process.env.CI ? 1 : undefined, // Sequential in CI
}
```

## Debugging Tests

### Visual Debugging
```bash
# Opens Playwright UI for step-by-step debugging
npm run test:e2e:ui
```

### Trace Viewer
Tests automatically capture traces on failure:
```bash
# View trace for failed test
npx playwright show-trace test-results/[test-name]/trace.zip
```

### Screenshots and Videos
- Screenshots captured on failure
- Videos retained for failed tests
- Available in `test-results/` directory

## Test Data Management

### Mock Users
```javascript
{
  id: 'user123',
  email: 'test@example.com',
  wallet: null
}
```

### Mock Wallets
```javascript
{
  id: 'wallet-001',
  address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
  type: 'embedded'
}
```

## Performance Considerations

- Tests run in headed mode (required for extensions)
- Parallel execution disabled for stability
- Reasonable timeouts for async operations
- Network idle waiting for complete page loads

## Future Enhancements

1. **Visual Regression Testing**: Add screenshot comparison tests
2. **Accessibility Testing**: Integrate axe-core for a11y validation
3. **Performance Metrics**: Track and assert on performance metrics
4. **Cross-browser Testing**: Extend to Firefox and Edge
5. **API Mocking**: Implement more sophisticated API mocking
6. **Test Data Factory**: Create factory functions for test data

## Troubleshooting

### Extension Not Loading
- Ensure extension is built: `npm run build`
- Check extension path in playwright.config.ts
- Verify Chrome/Chromium is installed

### Tests Timing Out
- Increase timeout in playwright.config.ts
- Check for missing await statements
- Verify selectors are correct

### Flaky Tests
- Add explicit waits for elements
- Use network idle for navigation
- Implement retry logic for network operations

## References

- [Microsoft E2E Testing Playbook](https://microsoft.github.io/code-with-engineering-playbook/automated-testing/e2e-testing/)
- [Practical Guide to E2E Test Automation](https://zhiminzhan.medium.com/a-practical-guide-to-self-learning-e2e-test-automation-67d7db1ad046)
- [WXT Playwright Example](https://github.com/wxt-dev/examples/tree/main/examples/playwright-e2e-testing)
- [Playwright Documentation](https://playwright.dev/docs/intro)

---

*This testing framework ensures robust UI integration with the state layer while maintaining clean separation of concerns and following industry best practices.*