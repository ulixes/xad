import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group'

const socialPlatforms = [
  { id: 'x', name: 'X (Twitter)', icon: '/social-logos/x.png' },
  { id: 'reddit', name: 'Reddit', icon: '/social-logos/reddit.png' },
  { id: 'farcaster', name: 'Farcaster', icon: '/social-logos/farcaster.png' },
  { id: 'instagram', name: 'Instagram', icon: '/social-logos/instagram.png' },
  { id: 'youtube', name: 'YouTube', icon: '/social-logos/youtube.png' },
  { id: 'facebook', name: 'Facebook', icon: '/social-logos/facebook.png' },
  { id: 'douyin', name: 'Douyin/TikTok', icon: '/social-logos/douyin.png' },
  { id: 'xiaohongshu', name: 'XiaoHongShu', icon: '/social-logos/xiaohongshu.png' },
]

export default function EarningsCalculator() {
  const [selectedPlatform, setSelectedPlatform] = useState('x')
  const [accountAge, setAccountAge] = useState(2) // years
  const [language] = useState<'en' | 'zh'>(() => {
    // Check localStorage for saved language preference
    return (localStorage.getItem('locale') as 'en' | 'zh') || 'en'
  })
  
  // Translations
  const t = {
    en: {
      title: 'Calculate Earnings',
      accountAge: 'Account Age',
      years: 'years',
      year: 'year',
      followers: 'Followers',
      karma: 'Karma',
      subscribers: 'Subscribers',
      totalViews: 'Total Channel Views',
      totalLikes: 'Total Likes',
      likesAndCollects: 'Likes & Collects',
      estimatedEarnings: 'Estimated Earnings',
      perPost: 'Per Post',
      perComment: 'Per Comment',
      perUpvote: 'Per Upvote',
      perLike: 'Per Like',
      perView: 'Per View',
      perCollect: 'Per Collect',
      perRecast: 'Per Recast',
      perRetweet: 'Per Retweet',
      perShare: 'Per Share',
      perAward: 'Per Award',
      monthly: 'Monthly (30 posts)',
    },
    zh: {
      title: '计算收益',
      accountAge: '账户年龄',
      years: '年',
      year: '年',
      followers: '关注者',
      karma: '声望',
      subscribers: '订阅者',
      totalViews: '频道总观看次数',
      totalLikes: '总点赞数',
      likesAndCollects: '点赞和收藏',
      estimatedEarnings: '预估收益',
      perPost: '每条帖子',
      perComment: '每条评论',
      perUpvote: '每次点赞',
      perLike: '每个赞',
      perView: '每次观看',
      perCollect: '每次收藏',
      perRecast: '每次转发',
      perRetweet: '每次转推',
      perShare: '每次分享',
      perAward: '每个奖励',
      monthly: '每月 (30 条帖子)',
    }
  }

  // Platform-specific metrics
  const [followers, setFollowers] = useState(5000)
  const [karma, setKarma] = useState(10000) // Reddit
  const [subscribers, setSubscribers] = useState(1000) // YouTube
  const [totalViews, setTotalViews] = useState(100000) // YouTube
  const [totalLikes, setTotalLikes] = useState(50000) // TikTok/Douyin
  const [likesAndCollects, setLikesAndCollects] = useState(30000) // XiaoHongShu

  // Calculate estimated earnings based on engagement
  const calculateEarnings = () => {
    // Base rates per action (in cents)
    const baseRates = {
      x: { like: 20, comment: 200, retweet: 50 },
      reddit: { upvote: 10, comment: 250, award: 150 },
      instagram: { like: 25, comment: 300, share: 60 },
      youtube: { like: 15, comment: 400, view: 5 },
      facebook: { like: 15, comment: 200, share: 40 },
      douyin: { like: 30, comment: 350, share: 75 },
      xiaohongshu: { like: 25, comment: 400, collect: 150 },
      farcaster: { like: 50, comment: 500, recast: 100 },
    }

    const rates = baseRates[selectedPlatform as keyof typeof baseRates]
    
    // Account age multiplier
    const ageMultiplier = Math.min(1 + (accountAge / 2) * 0.5, 2.5)
    
    // Platform-specific value multiplier
    let valueMultiplier = 1
    
    if (selectedPlatform === 'reddit') {
      // Reddit: karma matters more than followers
      valueMultiplier = Math.min(1 + (karma / 50000) * 2, 4)
    } else if (selectedPlatform === 'youtube') {
      // YouTube: subscribers and total views both matter
      const subMultiplier = Math.min(1 + (subscribers / 10000) * 0.5, 3)
      const viewMultiplier = Math.min(1 + (totalViews / 1000000) * 0.5, 3)
      valueMultiplier = (subMultiplier + viewMultiplier) / 2
    } else if (selectedPlatform === 'douyin') {
      // TikTok: total likes show viral potential
      const followerMult = Math.min(1 + (followers / 10000) * 0.3, 2.5)
      const likesMult = Math.min(1 + (totalLikes / 100000) * 0.5, 3)
      valueMultiplier = (followerMult + likesMult) / 2
    } else if (selectedPlatform === 'xiaohongshu') {
      // XiaoHongShu: likes & collects combined metric
      const followerMult = Math.min(1 + (followers / 10000) * 0.3, 2.5)
      const engagementMult = Math.min(1 + (likesAndCollects / 50000) * 0.6, 3.5)
      valueMultiplier = (followerMult + engagementMult) / 2
    } else {
      // Others: just use followers
      valueMultiplier = Math.min(1 + (followers / 10000) * 0.3, 3.5)
    }
    
    // Calculate per-action earnings ranges (in dollars)
    const minMultiplier = 0.8
    const maxMultiplier = 1.5
    
    const primaryAction = selectedPlatform === 'reddit' ? 'upvote' : 
                         selectedPlatform === 'youtube' ? 'view' : 
                         selectedPlatform === 'xiaohongshu' ? 'like' : 'like'
    const secondaryAction = selectedPlatform === 'xiaohongshu' ? 'collect' : 'comment'
    
    const primaryBase = (rates[primaryAction as keyof typeof rates] * ageMultiplier * valueMultiplier) / 100
    const secondaryBase = (rates[secondaryAction as keyof typeof rates] * ageMultiplier * valueMultiplier) / 100
    
    const formatAmount = (amount: number) => {
      if (amount >= 1) {
        return amount.toFixed(0)
      } else {
        return amount.toFixed(2)
      }
    }
    
    return {
      primaryMin: formatAmount(primaryBase * minMultiplier),
      primaryMax: formatAmount(primaryBase * maxMultiplier),
      secondaryMin: formatAmount(secondaryBase * minMultiplier),
      secondaryMax: formatAmount(secondaryBase * maxMultiplier),
      primaryLabel: selectedPlatform === 'reddit' ? 'Upvote' : 
                   selectedPlatform === 'youtube' ? 'View' : 
                   selectedPlatform === 'xiaohongshu' ? 'Like' : 'Like',
      secondaryLabel: selectedPlatform === 'xiaohongshu' ? 'Collect' : 'Comment'
    }
  }

  const earnings = calculateEarnings()

  return (
    <div className="w-full">
      <h3 className="text-2xl font-bold text-foreground mb-4">
        {t[language].title}
      </h3>
      
      {/* Platform Selection */}
      <div className="mb-6">
        <div className="grid grid-cols-4 gap-2">
          {socialPlatforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => setSelectedPlatform(platform.id)}
              className={`p-2 rounded-lg border-2 transition-all cursor-pointer ${
                selectedPlatform === platform.id
                  ? 'border-primary bg-primary/30'
                  : 'border-border hover:border-primary/50 hover:bg-primary/10'
              }`}
              title={platform.name}
            >
              <img 
                src={platform.icon} 
                alt={platform.name}
                className="w-8 h-8 mx-auto rounded"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Account Age */}
      <div className="mb-4 mt-6">
        <label className="text-base font-medium text-card-foreground mb-2 block">
          {t[language].accountAge}: <span className="font-bold">{accountAge < 1 ? `<1 ${t[language].year}` : `${accountAge} ${accountAge === 1 ? t[language].year : t[language].years}`}</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-base text-muted-foreground font-medium">&lt;1</span>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={accountAge}
            onChange={(e) => setAccountAge(Number(e.target.value))}
            className="w-full"
            style={{
              background: `linear-gradient(to right, #818cf8 0%, #818cf8 ${accountAge * 10}%, #3a3633 ${accountAge * 10}%, #3a3633 100%)`,
              accentColor: '#818cf8'
            }}
          />
          <span className="text-base text-muted-foreground font-medium">10+</span>
        </div>
      </div>

      {/* Platform-specific metrics */}
      <div className="h-32">
      {selectedPlatform === 'reddit' ? (
        <>
          <div className="mb-4">
            <label className="text-base font-medium text-card-foreground mb-2 block">
              Karma: <span className="font-bold">{karma === 100000 ? '100k' : karma.toLocaleString()}</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-base text-muted-foreground font-medium">&lt;100</span>
              <input
                type="range"
                min="100"
                max="100000"
                step="100"
                value={karma}
                onChange={(e) => setKarma(Number(e.target.value))}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, #818cf8 0%, #818cf8 ${karma / 1000}%, #3a3633 ${karma / 1000}%, #3a3633 100%)`,
                  accentColor: '#818cf8'
                }}
              />
              <span className="text-base text-muted-foreground font-medium">100k+</span>
            </div>
          </div>
        </>
      ) : selectedPlatform === 'youtube' ? (
        <>
          <div className="mb-4">
            <label className="text-base font-medium text-card-foreground mb-2 block">
              Subscribers: <span className="font-bold">{subscribers === 100000 ? '100k' : subscribers.toLocaleString()}</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-base text-muted-foreground font-medium">&lt;100</span>
              <input
                type="range"
                min="100"
                max="100000"
                step="100"
                value={subscribers}
                onChange={(e) => setSubscribers(Number(e.target.value))}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, #818cf8 0%, #818cf8 ${subscribers / 1000}%, #3a3633 ${subscribers / 1000}%, #3a3633 100%)`,
                  accentColor: '#818cf8'
                }}
              />
              <span className="text-base text-muted-foreground font-medium">100k+</span>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-base font-medium text-card-foreground mb-2 block">
              Total Channel Views: <span className="font-bold">{totalViews === 10000000 ? '10M' : totalViews.toLocaleString()}</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-base text-muted-foreground font-medium">&lt;1k</span>
              <input
                type="range"
                min="1000"
                max="10000000"
                step="1000"
                value={totalViews}
                onChange={(e) => setTotalViews(Number(e.target.value))}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, #818cf8 0%, #818cf8 ${totalViews / 100000}%, #3a3633 ${totalViews / 100000}%, #3a3633 100%)`,
                  accentColor: '#818cf8'
                }}
              />
              <span className="text-base text-muted-foreground font-medium">10M+</span>
            </div>
          </div>
        </>
      ) : selectedPlatform === 'douyin' ? (
        <>
          <div className="mb-4">
            <label className="text-base font-medium text-card-foreground mb-2 block">
              Followers: <span className="font-bold">{followers === 100000 ? '100k' : followers.toLocaleString()}</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-base text-muted-foreground font-medium">&lt;100</span>
              <input
                type="range"
                min="100"
                max="100000"
                step="100"
                value={followers}
                onChange={(e) => setFollowers(Number(e.target.value))}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, #818cf8 0%, #818cf8 ${followers / 1000}%, #3a3633 ${followers / 1000}%, #3a3633 100%)`,
                  accentColor: '#818cf8'
                }}
              />
              <span className="text-base text-muted-foreground font-medium">100k+</span>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-base font-medium text-card-foreground mb-2 block">
              Total Likes: <span className="font-bold">{totalLikes === 1000000 ? '1M' : totalLikes.toLocaleString()}</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-base text-muted-foreground font-medium">&lt;1k</span>
              <input
                type="range"
                min="1000"
                max="1000000"
                step="1000"
                value={totalLikes}
                onChange={(e) => setTotalLikes(Number(e.target.value))}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, #818cf8 0%, #818cf8 ${totalLikes / 10000}%, #3a3633 ${totalLikes / 10000}%, #3a3633 100%)`,
                  accentColor: '#818cf8'
                }}
              />
              <span className="text-base text-muted-foreground font-medium">1M+</span>
            </div>
          </div>
        </>
      ) : selectedPlatform === 'xiaohongshu' ? (
        <>
          <div className="mb-4">
            <label className="text-base font-medium text-card-foreground mb-2 block">
              Followers: <span className="font-bold">{followers === 100000 ? '100k' : followers.toLocaleString()}</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-base text-muted-foreground font-medium">&lt;100</span>
              <input
                type="range"
                min="100"
                max="100000"
                step="100"
                value={followers}
                onChange={(e) => setFollowers(Number(e.target.value))}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, #818cf8 0%, #818cf8 ${followers / 1000}%, #3a3633 ${followers / 1000}%, #3a3633 100%)`,
                  accentColor: '#818cf8'
                }}
              />
              <span className="text-base text-muted-foreground font-medium">100k+</span>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-base font-medium text-card-foreground mb-2 block">
              Likes & Collects: <span className="font-bold">{likesAndCollects === 1000000 ? '1M' : likesAndCollects.toLocaleString()}</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-base text-muted-foreground font-medium">&lt;1k</span>
              <input
                type="range"
                min="1000"
                max="1000000"
                step="1000"
                value={likesAndCollects}
                onChange={(e) => setLikesAndCollects(Number(e.target.value))}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, #818cf8 0%, #818cf8 ${likesAndCollects / 10000}%, #3a3633 ${likesAndCollects / 10000}%, #3a3633 100%)`,
                  accentColor: '#818cf8'
                }}
              />
              <span className="text-base text-muted-foreground font-medium">1M+</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4">
            <label className="text-base font-medium text-card-foreground mb-2 block">
              Followers: <span className="font-bold">{followers >= 100000 ? '100k+' : followers.toLocaleString()}</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-base text-muted-foreground font-medium">&lt;100</span>
              <input
                type="range"
                min="100"
                max="100000"
                step="100"
                value={followers}
                onChange={(e) => setFollowers(Number(e.target.value))}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, #818cf8 0%, #818cf8 ${followers / 1000}%, #3a3633 ${followers / 1000}%, #3a3633 100%)`,
                  accentColor: '#818cf8'
                }}
              />
              <span className="text-base text-muted-foreground font-medium">100k+</span>
            </div>
          </div>
        </>
      )}
      </div>

      {/* Spacer above earnings */}
      <div className="h-6"></div>

      {/* Earnings Display */}
      <div className="border-t-2 border-border rounded-none sm:rounded-b-2xl py-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xl text-card-foreground">
              {earnings.primaryLabel === 'Post' ? t[language].perPost : 
               earnings.primaryLabel === 'Upvote' ? t[language].perUpvote :
               earnings.primaryLabel === 'Like' ? t[language].perLike :
               earnings.primaryLabel === 'View' ? t[language].perView : 
               earnings.primaryLabel}:
            </span>
            <span className="font-bold text-xl text-card-foreground">
              ${earnings.primaryMin} - ${earnings.primaryMax}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xl text-card-foreground">
              {earnings.secondaryLabel === 'Comment' ? t[language].perComment :
               earnings.secondaryLabel === 'Share' ? t[language].perShare :
               earnings.secondaryLabel === 'Award' ? t[language].perAward :
               earnings.secondaryLabel === 'Recast' ? t[language].perRecast :
               earnings.secondaryLabel === 'Retweet' ? t[language].perRetweet :
               earnings.secondaryLabel === 'Collect' ? t[language].perCollect :
               earnings.secondaryLabel}:
            </span>
            <span className="font-bold text-xl text-card-foreground">
              ${earnings.secondaryMin} - ${earnings.secondaryMax}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}