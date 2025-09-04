import { db } from "../db";
import { taskAssignments, tasks } from "../db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

async function addTestData() {
  console.log("Adding test data for cashout progress testing...");
  
  // Get multiple available tasks
  const availableTasks = await db.select().from(tasks).limit(10);
  
  if (availableTasks.length < 8) {
    console.error(`Need at least 8 tasks, but only found ${availableTasks.length}. Please run ./api.sh first to create more tasks.`);
    process.exit(1);
  }
  
  const testUserId = "test-user-001";
  console.log(`Found ${availableTasks.length} tasks to use`);
  console.log(`Creating assignments for user: ${testUserId}`);
  
  // Clear existing test assignments for this user
  await db.delete(taskAssignments).where(eq(taskAssignments.userId, testUserId));
  console.log("Cleared existing test assignments");
  
  // Create test assignments with different statuses
  const testAssignments = [
    // Approved tasks ($50 total - solid green in progress bar)
    {
      taskAssignmentId: randomUUID(),
      taskId: availableTasks[0].taskId,
      userId: testUserId,
      status: 'approved' as const,
      rewardAmount: '25.00',
      currency: 'USD' as const,
      submittedAt: new Date('2025-08-20T10:00:00'),
      approvedAt: new Date('2025-08-27T10:00:00'),
      createdAt: new Date('2025-08-19T10:00:00')
    },
    {
      taskAssignmentId: randomUUID(),
      taskId: availableTasks[1].taskId,
      userId: testUserId,
      status: 'approved' as const,
      rewardAmount: '25.00',
      currency: 'USD' as const,
      submittedAt: new Date('2025-08-21T10:00:00'),
      approvedAt: new Date('2025-08-28T10:00:00'),
      createdAt: new Date('2025-08-20T10:00:00')
    },
    // Submitted tasks ($20.50 total - part of dashed blue potential)
    {
      taskAssignmentId: randomUUID(),
      taskId: availableTasks[2].taskId,
      userId: testUserId,
      status: 'submitted' as const,
      rewardAmount: '10.25',
      currency: 'USD' as const,
      submittedAt: new Date('2025-09-03T10:00:00'),
      createdAt: new Date('2025-09-03T09:00:00')
    },
    {
      taskAssignmentId: randomUUID(),
      taskId: availableTasks[3].taskId,
      userId: testUserId,
      status: 'submitted' as const,
      rewardAmount: '10.25',
      currency: 'USD' as const,
      submittedAt: new Date('2025-09-03T11:00:00'),
      createdAt: new Date('2025-09-03T10:00:00')
    },
    // Awaiting tasks ($15.75 total - part of dashed blue potential, with countdown)
    {
      taskAssignmentId: randomUUID(),
      taskId: availableTasks[4].taskId,
      userId: testUserId,
      status: 'awaiting' as const,
      rewardAmount: '8.00',
      currency: 'USD' as const,
      submittedAt: new Date('2025-08-30T10:00:00'),
      createdAt: new Date('2025-08-30T09:00:00')
    },
    {
      taskAssignmentId: randomUUID(),
      taskId: availableTasks[5].taskId,
      userId: testUserId,
      status: 'awaiting' as const,
      rewardAmount: '7.75',
      currency: 'USD' as const,
      submittedAt: new Date('2025-09-01T10:00:00'),
      createdAt: new Date('2025-09-01T09:00:00')
    },
    // Other statuses for completeness
    {
      taskAssignmentId: randomUUID(),
      taskId: availableTasks[6].taskId,
      userId: testUserId,
      status: 'assigned' as const,
      rewardAmount: '5.00',
      currency: 'USD' as const,
      createdAt: new Date('2025-09-03T12:00:00')
    },
    {
      taskAssignmentId: randomUUID(),
      taskId: availableTasks[7].taskId,
      userId: testUserId,
      status: 'rejected' as const,
      rewardAmount: '3.00',
      currency: 'USD' as const,
      createdAt: new Date('2025-08-15T10:00:00')
    }
  ];
  
  for (const assignment of testAssignments) {
    await db.insert(taskAssignments).values(assignment);
    console.log(`✅ Created ${assignment.status} assignment: ${assignment.rewardAmount} USD`);
  }
  
  console.log("\n📊 Test Data Summary:");
  console.log("====================");
  console.log("• Approved: $50.00 (2 tasks)");
  console.log("• Submitted: $20.50 (2 tasks)");
  console.log("• Awaiting: $15.75 (2 tasks)");
  console.log("• Assigned: $5.00 (1 task)");
  console.log("• Rejected: $3.00 (1 task)");
  console.log("\n• Total approved balance: $50.00");
  console.log("• Total potential balance: $36.25");
  console.log("• Cash out limit: $100.00 (default)");
  console.log("• Progress: 50%");
  console.log("• Potential progress: 86.25%");
  console.log("• Eligible for cashout: No (need $50.00 more)");
  
  console.log("\n✅ Test data added successfully!");
  console.log("Test the endpoint: curl http://localhost:3001/api/users/test-user-001/cashout-progress-test");
  
  process.exit(0);
}

addTestData().catch(console.error);