# XAD Task Platform - Admin API Documentation

Base URL: `http://localhost:3001/api/admin`

## 🔧 Task Management

### Create New Task
```bash
curl -X POST http://localhost:3001/api/admin/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Comment Offers",
    "description": "Write a detailed review about this crypto project",
    "payoutAmount": 2.50,
    "platform": "REDDIT",
    "link": "https://reddit.com/r/crypto/post/123",
    "isActive": true
  }'
```

**Valid Categories:** `"Upvote Offers"`, `"Comment Offers"`, `"Follow Offers"`  
**Valid Platforms:** `"REDDIT"`, `"FARCASTER"`, `"TWITTER"`

### Update Existing Task
```bash
curl -X PUT http://localhost:3001/api/admin/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated task description",
    "payoutAmount": 3.00,
    "isActive": false
  }'
```

### Deactivate Task
```bash
curl -X DELETE http://localhost:3001/api/admin/tasks/1
```

### Get All Tasks (with stats)
```bash
curl http://localhost:3001/api/admin/tasks
```

## 👥 User Management  

### Create New User
```bash
curl -X POST http://localhost:3001/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "walletAddress": "0x1234567890abcdef",
    "balance": "0.00",
    "cashOutLimit": "5.00"
  }'
```

### Get All Users (with stats)
```bash
curl http://localhost:3001/api/admin/users
```

## 📋 Submission Management

### Get Pending Submissions
```bash
curl http://localhost:3001/api/admin/submissions/pending
```

### Bulk Approve Submissions
```bash
curl -X POST http://localhost:3001/api/admin/submissions/bulk-action \
  -H "Content-Type: application/json" \
  -d '{
    "submissionIds": [1, 2, 3],
    "action": "approve"
  }'
```

### Bulk Reject Submissions
```bash
curl -X POST http://localhost:3001/api/admin/submissions/bulk-action \
  -H "Content-Type: application/json" \
  -d '{
    "submissionIds": [4, 5, 6],
    "action": "reject",
    "rejectionReason": "Screenshot does not match task requirements"
  }'
```

## 📊 Platform Statistics

### Get Platform Stats
```bash
curl http://localhost:3001/api/admin/stats
```

Returns:
```json
{
  "totalUsers": 2,
  "activeTasks": 5,
  "completedTasks": 3,
  "pendingSubmissions": 1,
  "totalPayout": 1.55
}
```

## 🎯 Quick Task Creation Examples

### Reddit Upvote Task
```bash
curl -X POST http://localhost:3001/api/admin/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Upvote Offers",
    "description": "Upvote this post about AI developments",
    "payoutAmount": 0.10,
    "platform": "REDDIT",
    "link": "https://reddit.com/r/artificial/comments/example"
  }'
```

### Farcaster Follow Task
```bash
curl -X POST http://localhost:3001/api/admin/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Follow Offers", 
    "description": "Follow @vitalik on Farcaster",
    "payoutAmount": 0.75,
    "platform": "FARCASTER",
    "link": "https://warpcast.com/vitalik"
  }'
```

### Twitter Comment Task  
```bash
curl -X POST http://localhost:3001/api/admin/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Comment Offers",
    "description": "Reply with your thoughts on this crypto thread",
    "payoutAmount": 1.25,
    "platform": "TWITTER",
    "link": "https://twitter.com/elonmusk/status/123456789"
  }'
```

### High-Value Content Task
```bash
curl -X POST http://localhost:3001/api/admin/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Comment Offers",
    "description": "Write a 500-word detailed analysis of this DeFi protocol",
    "payoutAmount": 10.00,
    "platform": "REDDIT",
    "link": "https://reddit.com/r/defi/comments/analysis-request"
  }'
```

## 🔍 Manual Task Verification

### Verify Individual Submission
```bash
curl -X POST http://localhost:3001/api/tasks/submissions/1/verify \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true
  }'
```

### Reject Individual Submission
```bash
curl -X POST http://localhost:3001/api/tasks/submissions/2/verify \
  -H "Content-Type: application/json" \
  -d '{
    "approved": false,
    "rejectionReason": "Screenshot quality too low"
  }'
```

## 📈 Bulk Operations for Scale

### Create Multiple Tasks at Once
```bash
# Task 1
curl -X POST http://localhost:3001/api/admin/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Upvote Offers",
    "description": "Upvote crypto news post",
    "payoutAmount": 0.05,
    "platform": "REDDIT",
    "link": "https://reddit.com/r/crypto/post1"
  }'

# Task 2  
curl -X POST http://localhost:3001/api/admin/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Follow Offers",
    "description": "Follow @cryptocom",
    "payoutAmount": 0.50,
    "platform": "TWITTER",
    "link": "https://twitter.com/cryptocom"
  }'

# Task 3
curl -X POST http://localhost:3001/api/admin/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Comment Offers",
    "description": "Comment on Farcaster thread about Web3",
    "payoutAmount": 1.00,
    "platform": "FARCASTER", 
    "link": "https://warpcast.com/thread/web3-discussion"
  }'
```

## ⚡ Quick Setup for 100+ Users

### 1. Check Current Stats
```bash
curl http://localhost:3001/api/admin/stats
```

### 2. Create High-Volume Tasks
```bash
# Create 10 quick tasks for immediate user engagement
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/admin/tasks \
    -H "Content-Type: application/json" \
    -d "{
      \"category\": \"Upvote Offers\",
      \"description\": \"Upvote post #$i - Easy engagement task\",
      \"payoutAmount\": 0.05,
      \"platform\": \"REDDIT\",
      \"link\": \"https://reddit.com/r/example/post$i\"
    }"
done
```

### 3. Monitor Pending Submissions
```bash
# Check every 30 seconds
watch -n 30 'curl -s http://localhost:3001/api/admin/submissions/pending | jq ".submissions | length"'
```

## 🚨 Error Handling

All endpoints return consistent error formats:
```json
{
  "error": "Description of what went wrong",
  "status": 400
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created  
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (duplicate email)
- `500` - Internal Server Error