import { useState } from 'react'
import { Button } from './ui/button'
import EarningsCalculator from './EarningsCalculator'

export default function Hero() {
  const [language] = useState<'en' | 'zh'>(() => {
    return (localStorage.getItem('locale') as 'en' | 'zh') || 'en'
  })

  const t = {
    en: {
      title: "Get paid to be genuine.",
      subtitle1: "Earn money 💰️ when you like ❤️ and comment 💬 across social media.",
      subtitle2: "Grift-free influencer marketing.",
      installChrome: "Install for Chrome",
      viewGithub: "View on GitHub"
    },
    zh: {
      title: "真实互动，赚取收益。",
      subtitle1: "在社交媒体上点赞 ❤️ 和评论 💬，赚取金钱 💰️。",
      subtitle2: "无虚假的影响力营销。",
      installChrome: "安装 Chrome 扩展",
      viewGithub: "在 GitHub 上查看"
    }
  }

  return (
    <section className="relative overflow-hidden bg-primary">
      <div className="relative py-24 sm:py-32">
        <div className="flex flex-col lg:flex-row lg:container lg:mx-auto lg:max-w-7xl items-center gap-12 lg:gap-12">
          {/* Left side - Text content */}
          <div className="flex-1 text-left px-4 lg:px-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-primary-foreground mb-6 tracking-tight">
              {t[language].title}
            </h1>
            
            <p className="text-xl sm:text-2xl text-primary-foreground/90 mb-6 max-w-2xl">
              {language === 'en' ? (
                <>Earn <b>money 💰️</b> when you <b>like ❤️</b> and <b>comment 💬</b> across social media.</>
              ) : (
                <>在社交媒体上<b>点赞 ❤️</b> 和<b>评论 💬</b>，赚取<b>金钱 💰️</b>。</>
              )}
            </p>
            
            <p className="text-xl sm:text-2xl text-primary-foreground/90 mb-12 max-w-2xl">
              {t[language].subtitle2}
            </p>

            <div className="flex flex-col gap-4 w-full sm:flex-row sm:w-auto">
              <Button 
                size="lg" 
                variant="secondary"
                className="w-full sm:w-auto font-semibold shadow-md hover:shadow-lg transition-shadow"
                onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
              >
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="4"/>
                  <line x1="21.17" y1="8" x2="12" y2="8"/>
                  <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
                  <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
                </svg>
                {t[language].installChrome}
              </Button>
              
              <Button 
                size="lg" 
                variant="ghost"
                className="w-full sm:w-auto border-2 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/20 hover:border-primary-foreground/70 font-semibold"
                onClick={() => window.open('https://github.com', '_blank')}
              >
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                </svg>
                {t[language].viewGithub}
              </Button>
            </div>
          </div>

          {/* Right side - Calculator */}
          <div className="flex-1 w-full lg:max-w-md lg:px-4 pt-8 lg:pt-0">
            <EarningsCalculator />
          </div>
        </div>
      </div>
    </section>
  )
}