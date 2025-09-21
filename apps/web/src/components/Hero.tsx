import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import LiveActivityFeed from './LiveActivityFeed'

export default function Hero() {
  const navigate = useNavigate()
  const [language] = useState<'en' | 'zh'>(() => {
    return (localStorage.getItem('locale') as 'en' | 'zh') || 'en'
  })

  const t = {
    en: {
      title: "Micro-influencer marketing at scale",
      description: "Users like, comment, and engage to receive money. Advertisers only pay when qualified users engage. Powered by zero-knowledge proofs.",
      userCta: "Start Earning",
      brandCta: "Start Advertising"
    },
    zh: {
      title: "大规模自动化影响者营销",
      description: "用户点赞、评论和互动即可获得报酬。广告商仅在合格用户参与时付费。由零知识证明提供支持。",
      userCta: "开始赚钱",
      brandCta: "开始投放广告"
    }
  }

  return (
    <section className="relative overflow-hidden">
      {/* Radial glow background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(77, 97, 255, 0.25), transparent 70%), #0a0a0a",
        }}
      />
      <div className="relative py-16 sm:py-20 lg:py-24 z-10">
        <div className="container mx-auto px-4">
          {/* Main Title */}
          <div className="text-left sm:text-center mb-12 max-w-5xl mx-auto">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-foreground mb-8 tracking-tighter text-left sm:text-center">
              {t[language].title}
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl sm:mx-auto leading-relaxed text-left sm:text-center">
              {t[language].description}
            </p>
          </div>

          {/* CTAs - Max 2 buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="font-semibold text-lg px-8 py-6"
              onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="4"/>
                <line x1="21.17" y1="8" x2="12" y2="8"/>
                <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
                <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
              </svg>
              {t[language].userCta}
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="font-semibold text-lg px-8 py-6"
              onClick={() => navigate('/')}
            >
              {t[language].brandCta}
            </Button>
          </div>

          {/* Live Activity Feed */}
          <div className="mb-12">
            <LiveActivityFeed />
          </div>
        </div>
      </div>
    </section>
  )
}