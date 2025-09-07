import { useState } from 'react'

export default function Footer() {
  const [language] = useState<'en' | 'zh'>(() => {
    return (localStorage.getItem('locale') as 'en' | 'zh') || 'en'
  })

  const t = {
    en: {
      tagline: "Transforming social media engagement into cryptocurrency rewards.",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      copyright: "© 2025 Xadvo. All rights reserved."
    },
    zh: {
      tagline: "将社交媒体互动转化为加密货币奖励。",
      privacyPolicy: "隐私政策",
      termsOfService: "服务条款",
      copyright: "© 2025 Xadvo. 保留所有权利。"
    }
  }

  return (
    <footer className="bg-foreground text-background py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center space-y-6">
          <h3 className="text-2xl font-bold">Xadvo</h3>
          <p className="text-background/70 max-w-2xl">
            {t[language].tagline}
          </p>
          
          <div className="flex gap-4">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-background/70 hover:text-background transition-colors"
              aria-label="GitHub"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
              </svg>
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-background/70 hover:text-background transition-colors"
              aria-label="Twitter"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
              </svg>
            </a>
            <a 
              href="https://discord.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-background/70 hover:text-background transition-colors"
              aria-label="Discord"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </a>
          </div>
          
          <div className="flex gap-6 text-sm">
            <a href="/privacy" className="text-background/70 hover:text-background transition-colors">
              {t[language].privacyPolicy}
            </a>
            <span className="text-background/40">•</span>
            <a href="/terms" className="text-background/70 hover:text-background transition-colors">
              {t[language].termsOfService}
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-background/20 text-center text-background/60">
          <p>{t[language].copyright}</p>
        </div>
      </div>
    </footer>
  )
}