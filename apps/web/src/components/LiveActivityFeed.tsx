import { useState, useEffect } from 'react';
import { 
  InstagramLogo, 
  RedditLogo, 
  TwitterLogo, 
  YoutubeLogo, 
  TiktokLogo 
} from '@phosphor-icons/react';

interface Activity {
  id: number;
  brand: string;
  username: string;
  amount: string;
  action: string;
  platform: 'instagram' | 'reddit' | 'twitter' | 'youtube' | 'tiktok';
}

export default function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [, setCurrentId] = useState<number>(0);
  const [isNewActivity, setIsNewActivity] = useState(false);

  const getPlatformIcon = (platform: Activity['platform']) => {
    switch (platform) {
      case 'instagram':
        return (
          <div className="w-5 h-5 flex items-center justify-center" style={{
            background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
            borderRadius: '25%'
          }}>
            <InstagramLogo size={16} weight="bold" className="text-white" />
          </div>
        );
      case 'reddit':
        return <RedditLogo size={20} weight="fill" style={{ color: '#FF4500' }} />;
      case 'twitter':
        return <TwitterLogo size={20} weight="fill" style={{ color: '#1DA1F2' }} />;
      case 'youtube':
        return <YoutubeLogo size={20} weight="fill" style={{ color: '#FF0000' }} />;
      case 'tiktok':
        return <TiktokLogo size={20} weight="fill" className="text-black dark:text-white" />;
      default:
        return null;
    }
  };

  const brandNames = [
    'FitGear Pro', 'CloudSync', 'NatureFresh', 'TechFlow Apps',
    'Urban Streetwear', 'Mindful App', 'CryptoWallet', 'GamersHub',
    'Eco Clean', 'Digital Arts', 'Home Chef', 'Pet Paradise',
    'Travel Buddy', 'Fitness Pro', 'Smart Home', 'LangLearn Plus',
    'Coffee Roasters', 'Adventure Gear', 'Beauty Box', 'CodeCamp Pro'
  ];
  
  const usernames = [
    'sarah_travels', 'mikejohnson', 'emily.chen', 'alex_dev',
    'jessicaart', 'davidlee23', 'sophie_marie', 'carlos.rodriguez',
    'amy_fitness', 'kevin.ng', 'lisa_photography', 'james_cook',
    'natalie.w', 'robert_tech', 'maya.patel', 'chris_gaming',
    'olivia.jones', 'daniel_music', 'grace.kim', 'lucas_sports'
  ];
  
  const subreddits = [
    'r/tech', 'r/gaming', 'r/fitness', 'r/food', 'r/travel',
    'r/coding', 'r/art', 'r/music', 'r/movies', 'r/books',
    'r/science', 'r/nature', 'r/DIY', 'r/finance', 'r/crypto',
    'r/startup', 'r/business', 'r/marketing', 'r/design', 'r/photos'
  ];
  
  // Platform-specific actions
  const platformActions = {
    instagram: ['like', 'comment', 'story view', 'reel share'],
    reddit: ['upvote', 'comment', 'post'],
    twitter: ['like', 'retweet', 'reply', 'quote tweet'],
    youtube: ['like', 'comment', 'subscribe', 'view'],
    tiktok: ['like', 'comment', 'share', 'follow']
  };
  
  const platforms: Activity['platform'][] = ['instagram', 'reddit', 'twitter', 'youtube', 'tiktok'];

  const generateActivity = (id: number): Activity => {
    const brand = brandNames[Math.floor(Math.random() * brandNames.length)];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const baseUsername = usernames[Math.floor(Math.random() * usernames.length)];
    
    // Add @ for Instagram, Twitter, and TikTok, u/ for Reddit
    let username = baseUsername;
    if (['instagram', 'twitter', 'tiktok'].includes(platform)) {
      username = `@${baseUsername}`;
    } else if (platform === 'reddit') {
      username = `u/${baseUsername.replace(/\./g, '_')}`;
    }
    
    // Get platform-specific action
    const actions = platformActions[platform as keyof typeof platformActions];
    let action = actions[Math.floor(Math.random() * actions.length)];
    
    // Add subreddit context for Reddit
    if (platform === 'reddit') {
      const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
      action = `${action} in ${subreddit}`;
    }
    
    // Vary amounts based on action type
    let amount = '$0.00';
    const baseAction = action.split(' ')[0]; // Get base action for Reddit
    if (['subscribe', 'follow', 'award'].includes(baseAction)) {
      amount = `$${(2.5 + Math.random() * 3).toFixed(2)}`; // $2.50-$5.50
    } else if (['comment', 'reply', 'post'].includes(baseAction)) {
      amount = `$${(1.0 + Math.random() * 2.5).toFixed(2)}`; // $1.00-$3.50
    } else if (['like', 'upvote', 'view'].includes(baseAction)) {
      amount = `$${(0.05 + Math.random() * 0.45).toFixed(2)}`; // $0.05-$0.50
    } else {
      amount = `$${(0.5 + Math.random() * 1.5).toFixed(2)}`; // $0.50-$2.00
    }

    return { id, brand, username, amount, action, platform };
  };

  useEffect(() => {
    // Generate initial activities
    const initialActivities = [
      generateActivity(0),
      generateActivity(1),
      generateActivity(2)
    ];
    setActivities(initialActivities);
    setCurrentId(3);

    // Generate new activity every 3 seconds
    const interval = setInterval(() => {
      setIsNewActivity(true);
      setTimeout(() => setIsNewActivity(false), 100);
      
      setCurrentId(prev => {
        const newId = prev + 1;
        const newActivity = generateActivity(newId);
        setActivities(current => [newActivity, ...current.slice(0, 2)]);
        return newId;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="space-y-3 relative">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={`bg-card rounded-xl p-4 transition-all duration-700 ease-in-out ${
              index === 0 && isNewActivity ? 'animate-slide-down' : ''
            }`}
            style={{
              opacity: index === 0 ? 1 : Math.max(0.4, 1 - index * 0.3),
              transform: `translateY(${index === 0 && isNewActivity ? '-20px' : '0'})`,
            }}
          >
            <div className="flex items-center gap-4">
              {getPlatformIcon(activity.platform)}
              <div className="text-base flex-1 overflow-hidden">
                <div className="whitespace-nowrap text-ellipsis overflow-hidden">
                  <span className="font-semibold text-primary">{activity.username}</span>
                  <span className="text-muted-foreground"> earned </span>
                  <span className="font-bold text-green-500 text-lg">{activity.amount}</span>
                  <span className="text-muted-foreground"> from </span>
                  <span className="font-semibold text-foreground">{activity.brand}</span>
                  <span className="text-muted-foreground"> for {activity.action}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .animate-slide-down {
          animation: smoothSlide 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes smoothSlide {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}