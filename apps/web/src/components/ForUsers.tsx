import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import EarningsCalculator from './EarningsCalculator'
import { useJackpotBalance } from '../hooks/useJackpotBalance'

export default function ForUsers() {
  const [language] = useState<'en' | 'zh'>(() => {
    return (localStorage.getItem('locale') as 'en' | 'zh') || 'en'
  })
  
  // Get real jackpot balance and time remaining
  const { balance: jackpotBalance, timeRemaining } = useJackpotBalance()
  
  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      if (timeRemaining <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 }
      }
      
      const totalHours = Math.floor(timeRemaining / 3600)
      const minutes = Math.floor((timeRemaining % 3600) / 60)
      const seconds = Math.floor(timeRemaining % 60)
      
      return { hours: totalHours, minutes, seconds }
    }
    
    setTimeLeft(calculateTimeLeft())
  }, [timeRemaining])
  
  useEffect(() => {
    // Update countdown every second
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev
        
        if (seconds > 0) {
          seconds--
        } else if (minutes > 0) {
          minutes--
          seconds = 59
        } else if (hours > 0) {
          hours--
          minutes = 59
          seconds = 59
        }
        
        return { hours, minutes, seconds }
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  /*
    en: [
      {
        title: "Highest Payouts",
        description: "Verified actions mean better rates – up to $0.52 per like and $5 per comment.",
        icon: "dollar"
      },
      {
        title: "Instant Cashouts", 
        description: "Get crypto immediately, no fees or waits.",
        icon: "zap"
      },
      {
        title: "Privacy First",
        description: "We never share your data or actions.",
        icon: "shield"
      },
      {
        title: "Fun Extras",
        description: "Daily tasks for lottery entries – win up to $1M!",
        icon: "gift"
      },
      {
        title: "Easy Start",
        description: "Install our Chrome extension and connect your accounts.",
        icon: "check"
      }
    ],
    zh: [
      {
        title: "最高报酬",
        description: "验证的操作意味着更高的费率 - 每个赞高达 $0.52，每条评论高达 $5。",
        icon: "dollar"
      },
      {
        title: "即时提现",
        description: "立即获得加密货币，无需等待，几乎零手续费。",
        icon: "zap"
      },
      {
        title: "隐私优先",
        description: "我们绝不分享您的数据或操作。",
        icon: "shield"
      },
      {
        title: "有趣的额外奖励",
        description: "完成每日任务获得抽奖机会 - 赢取高达 100 万美元！",
        icon: "gift"
      },
      {
        title: "轻松开始",
        description: "安装我们的 Chrome 扩展并连接您的账户。",
        icon: "check"
      }
    ]
  */

  const t = {
    en: {
      title: "For Users: Earn Crypto to Engage",
      description: "Like, comment, and promote posts across X, Reddit, Instagram, other social media. Qualify your account for a chance to win $1M USDC from the daily Megapot lottery.",
      whyLove: "Why Users Love zkad:",
      joinCta: "Join thousands earning from their social media activity.",
      downloadCta: "Get Extension",
      calculateCta: "Calculate Your Earnings",
      megapotTitle: "Win Big with Daily Tasks",
      megapotDescription: "Complete simple daily tasks to earn lottery tickets. Each ticket gives you a chance to win our $1M Megapot prize!",
      megapotCta: "View Jackpot"
    },
    zh: {
      title: "用户端：参与互动赚取加密货币",
      description: "在 X、Reddit、Instagram 等社交媒体上点赞、评论和推广帖子。让您的账户有资格赢得每日 Megapot 彩票的 100 万美元 USDC。",
      whyLove: "为什么用户喜欢 zkad：",
      joinCta: "加入数千名通过社交媒体活动赚钱的用户。",
      downloadCta: "获取扩展",
      calculateCta: "计算您的收益",
      megapotTitle: "完成日常任务赢大奖",
      megapotDescription: "完成简单的日常任务即可获得彩票。每张彩票都让您有机会赢得 100 万美元大奖！",
      megapotCta: "查看奖池"
    }
  }

  return (
    <section id="for-users" className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="bg-secondary/5 rounded-3xl p-8 lg:p-12">
          {/* Section Header */}
          <div className="mb-12 text-left">
          <div className="inline-flex items-center px-3 py-1.5 mb-6 bg-primary/10 border border-primary/20 rounded-full">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              {language === 'en' ? 'FOR USERS' : '用户端'}
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
            {language === 'en' ? 'Earn Crypto to Engage' : '参与互动赚取加密货币'}
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl">
            {t[language].description}
          </p>
        </div>

        {/* Two Panel Layout: Jackpot Left, Calculator Right */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Megapot Section - Left Panel */}
          <div className="bg-card rounded-2xl p-8">
            <div className="text-center h-full flex flex-col justify-center relative pb-16 lg:pb-0">
              {/* Current Jackpot Label */}
              <div className="inline-flex items-center px-3 py-1.5 mb-6 bg-primary/10 border border-primary/20 rounded-full mx-auto">
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">
                  {language === 'en' ? 'TODAY\'S MEGAPOT' : '今日奖池'}
                </span>
              </div>
              
              {/* Jackpot Amount */}
              <div className="flex items-baseline justify-center gap-2 mb-6">
                <p className="text-5xl md:text-6xl font-bold text-foreground">
                  ${jackpotBalance}
                </p>
                <span className="text-xl md:text-2xl font-semibold text-muted-foreground">
                  USDC
                </span>
              </div>
              
              {/* Countdown Timer */}
              <div className="mb-6">
                <div className="flex justify-center items-center gap-1">
                  <span className="text-3xl md:text-4xl font-mono font-bold text-foreground">
                    {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-lg text-muted-foreground mb-8">
                {language === 'en' ? 'Complete 1 daily task for a chance to win.' : '完成1个日常任务即有机会获胜。'}
              </p>
              
              <Button 
                size="lg" 
                className="font-semibold w-full absolute bottom-0 lg:bottom-0"
                onClick={() => window.open('https://megapot.io/', '_blank')}
              >
                {t[language].megapotCta}
              </Button>
            </div>
          </div>
          
          {/* Calculator - Right Panel */}
          <div className="bg-card rounded-2xl p-8">
            <EarningsCalculator />
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <p className="text-xl text-muted-foreground mb-8">
            {t[language].joinCta}
          </p>
          <Button 
            size="lg" 
            className="font-semibold text-lg px-8 py-6"
            onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
          >
            <svg className="mr-2 h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="4"/>
              <line x1="21.17" y1="8" x2="12" y2="8"/>
              <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
              <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
            </svg>
            {t[language].downloadCta}
          </Button>
        </div>
        </div>
      </div>
    </section>
  )
}