import { useState } from 'react'
import { Button } from './ui/button'

export default function InstallSection() {
  const [language] = useState<'en' | 'zh'>(() => {
    return (localStorage.getItem('locale') as 'en' | 'zh') || 'en'
  })

  const t = {
    en: {
      title: "Ready to Start Earning?",
      subtitle: "Join thousands of users who are already earning crypto for their social media activity",
      addToChrome: "Add to Chrome",
      viewSource: "View Source"
    },
    zh: {
      title: "准备好开始赚钱了吗？",
      subtitle: "加入数千名已经通过社交媒体活动赚取加密货币的用户",
      addToChrome: "添加到 Chrome",
      viewSource: "查看源代码"
    }
  }

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-primary rounded-3xl p-12 text-center shadow-xl border-2 border-border">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            {t[language].title}
          </h2>
          
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            {t[language].subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              variant="secondary"
              className="font-semibold shadow-md hover:shadow-lg transition-shadow"
              onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="4"/>
                <line x1="21.17" y1="8" x2="12" y2="8"/>
                <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
                <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
              </svg>
              {t[language].addToChrome}
            </Button>
            
            <Button 
              size="lg"
              variant="ghost"
              className="border-2 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/20 hover:border-primary-foreground/70 font-semibold"
              onClick={() => window.open('https://github.com', '_blank')}
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
              </svg>
              {t[language].viewSource}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}