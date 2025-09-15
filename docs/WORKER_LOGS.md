# 📊 Cloudflare Workers Logging Guide

## Real-Time Logs (Tail)

### View Live Logs from Command Line
```bash
# Production logs
wrangler tail --env production

# Staging logs
wrangler tail --env staging

# Filter by status
wrangler tail --env production --status error
wrangler tail --env production --status ok

# Filter by method
wrangler tail --env production --method POST
wrangler tail --env production --method GET

# Filter by path
wrangler tail --env production --search "/api/users"

# Save logs to file
wrangler tail --env production > production-logs.txt
```

### View Logs in Cloudflare Dashboard
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select **Workers & Pages**
3. Click on your worker (e.g., `xad-api-production`)
4. Go to **Logs** tab
5. Click **Begin log stream** to see real-time logs

## Log Levels

The deployment now sets:
- **Production**: `LOG_LEVEL = "info"` (less verbose)
- **Staging**: `LOG_LEVEL = "debug"` (more verbose)

## Adding Logs in Your Code

### Basic Console Logging
```javascript
// These will appear in wrangler tail and dashboard
console.log('Info message', { userId, action });
console.error('Error occurred', error);
console.warn('Warning message');
console.debug('Debug info', data);
```

### Structured Logging Example
```javascript
// In your API handlers
app.post('/api/users', async (c) => {
  const env = c.env;
  const logLevel = env.LOG_LEVEL || 'info';
  
  // Log incoming request
  if (logLevel === 'debug') {
    console.log('Incoming request', {
      method: c.req.method,
      url: c.req.url,
      headers: Object.fromEntries(c.req.headers),
    });
  }
  
  try {
    // Your logic here
    const result = await createUser(data);
    
    console.log('User created', {
      userId: result.id,
      timestamp: new Date().toISOString(),
    });
    
    return c.json(result);
  } catch (error) {
    console.error('Failed to create user', {
      error: error.message,
      stack: error.stack,
      requestId: c.req.headers.get('cf-ray'),
    });
    throw error;
  }
});
```

## Logpush (Enterprise Feature)

The configuration includes `logpush = true` which enables log forwarding to external services if you have:
- Cloudflare Enterprise plan
- Configured Logpush destinations (S3, BigQuery, etc.)

For free/pro plans, use `wrangler tail` or Dashboard logs.

## Debugging Production Issues

### 1. Quick Debug Session
```bash
# Start tailing logs
wrangler tail --env production

# In another terminal, trigger the issue
curl https://your-worker.workers.dev/api/endpoint

# Watch the logs in first terminal
```

### 2. Filter for Errors Only
```bash
# See only errors and failed requests
wrangler tail --env production --status error --format pretty
```

### 3. Export Logs for Analysis
```bash
# Capture 5 minutes of logs
timeout 300 wrangler tail --env production > logs-$(date +%Y%m%d-%H%M%S).txt

# Search logs
grep "ERROR" logs-*.txt
grep "user-id-here" logs-*.txt
```

## Best Practices

1. **Use Structured Logging**
   ```javascript
   // Good
   console.log('Action completed', { 
     action: 'createUser',
     userId: user.id,
     duration: performance.now() - start 
   });
   
   // Bad
   console.log('User created');
   ```

2. **Include Request IDs**
   ```javascript
   const requestId = c.req.headers.get('cf-ray') || crypto.randomUUID();
   console.log('Processing request', { requestId, ...data });
   ```

3. **Log at Appropriate Levels**
   ```javascript
   console.debug('Detailed info');  // Development only
   console.log('Normal operations'); // Production
   console.warn('Potential issues'); // Warnings
   console.error('Errors', error);   // Always log errors
   ```

4. **Avoid Logging Sensitive Data**
   ```javascript
   // Never log
   console.log('Password:', password); // ❌
   console.log('Token:', token);       // ❌
   
   // Safe to log
   console.log('User authenticated', { userId: user.id }); // ✅
   ```

## Monitoring Commands

```bash
# Check worker status
wrangler deployments list

# Get worker metrics
curl https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/workers/services/$WORKER_NAME/environments/production/metrics \
  -H "Authorization: Bearer $CF_API_TOKEN"

# Check recent deployments
wrangler deployments list --env production
```

## Troubleshooting

### Logs Not Appearing?
1. Check worker is deployed: `wrangler deployments list`
2. Verify logpush config in wrangler.toml
3. Ensure console.log statements are in async handlers
4. Check log level: production might filter debug logs

### Too Many Logs?
1. Adjust LOG_LEVEL in GitHub secrets
2. Use conditional logging:
   ```javascript
   if (env.LOG_LEVEL === 'debug') {
     console.debug('Verbose info');
   }
   ```

### View Historical Logs
- Free plan: Limited to real-time tail
- Pro plan: 24-hour retention in dashboard
- Enterprise: Configure Logpush to S3/BigQuery for long-term storage