import { db } from './index';
import { tasks, users, dailyQuests } from './schema';

async function seed() {
  console.log('Seeding database...');

  // Create sample users
  const sampleUsers = await db.insert(users).values([
    {
      privyUserId: 'did:privy:cm123456789abcdef',
      balance: '2.05',
      cashOutLimit: '5.00',
    },
    {
      privyUserId: 'did:privy:cm987654321fedcba',
      balance: '7.50',
      cashOutLimit: '5.00',
    },
  ]).returning();

  console.log('Created users:', sampleUsers.length);

  // Create sample tasks
  const sampleTasks = await db.insert(tasks).values([
    {
      category: 'Upvote Offers',
      description: 'Upvote weight loss product on Reddit',
      payoutAmount: '0.05',
      platform: 'REDDIT',
      link: 'https://reddit.com/r/example/post123',
    },
    {
      category: 'Comment Offers',
      description: 'Comment on this AI post',
      payoutAmount: '1.00',
      platform: 'FARCASTER',
      link: 'https://warpcast.com/post/ai-discussion-123',
    },
    {
      category: 'Follow Offers',
      description: 'Follow @techguru on Farcaster',
      payoutAmount: '0.50',
      platform: 'FARCASTER',
      link: 'https://warpcast.com/techguru',
    },
    {
      category: 'Upvote Offers',
      description: 'Upvote crypto discussion',
      payoutAmount: '0.10',
      platform: 'REDDIT',
      link: 'https://reddit.com/r/crypto/post456',
    },
    {
      category: 'Follow Offers',
      description: 'Follow @cryptoexpert on Twitter',
      payoutAmount: '0.75',
      platform: 'TWITTER',
      link: 'https://twitter.com/cryptoexpert',
    },
  ]).returning();

  console.log('Created tasks:', sampleTasks.length);

  // Create daily quests for users
  const dailyQuestData = sampleUsers.map(user => ({
    userId: user.privyUserId,
    tasksRequired: '3',
    tasksCompleted: user.privyUserId === sampleUsers[0].privyUserId ? '3' : '1', // First user completed quest
    isCompleted: user.privyUserId === sampleUsers[0].privyUserId,
    completedAt: user.privyUserId === sampleUsers[0].privyUserId ? new Date() : null,
  }));

  const createdQuests = await db.insert(dailyQuests).values(dailyQuestData).returning();
  console.log('Created daily quests:', createdQuests.length);

  console.log('Seeding completed successfully!');
}

async function main() {
  try {
    await seed();
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

main();