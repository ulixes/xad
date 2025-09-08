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
      copyright: "© 2025 zkad. All rights reserved."
    },
    zh: {
      tagline: "将社交媒体互动转化为加密货币奖励。",
      privacyPolicy: "隐私政策",
      termsOfService: "服务条款",
      copyright: "© 2025 zkad. 保留所有权利。"
    }
  }

  const navigationItems = [
    {
      title: language === 'en' ? "Product" : "产品",
      items: [
        {
          title: language === 'en' ? "Chrome Extension" : "Chrome 扩展",
          href: "/extension",
        },
        {
          title: language === 'en' ? "For Users" : "用户端",
          href: "#for-users",
        },
        {
          title: language === 'en' ? "For Brands" : "品牌端",
          href: "#for-brands",
        },
      ],
    },
    {
      title: language === 'en' ? "Resources" : "资源",
      items: [
        {
          title: language === 'en' ? "Documentation" : "文档",
          href: "/docs",
        },
        {
          title: "GitHub",
          href: "https://github.com",
        },
        {
          title: language === 'en' ? "FAQ" : "常见问题",
          href: "#faq",
        },
      ],
    },
    {
      title: language === 'en' ? "Company" : "公司",
      items: [
        {
          title: language === 'en' ? "About" : "关于",
          href: "/about",
        },
        {
          title: language === 'en' ? "Contact" : "联系",
          href: "/contact",
        },
      ],
    },
  ];

  return (
    <footer className="w-full py-16 lg:py-24 bg-foreground text-background">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="flex gap-8 flex-col items-start">
            <div className="flex gap-2 flex-col">
              <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-bold text-left">
                zkad
              </h2>
              <p className="text-lg max-w-lg leading-relaxed tracking-tight text-background/75 text-left">
                {t[language].tagline}
              </p>
            </div>
            <div className="flex gap-4">
              <a href="/terms" className="text-sm text-background/75 hover:text-background">
                {t[language].termsOfService}
              </a>
              <a href="/privacy" className="text-sm text-background/75 hover:text-background">
                {t[language].privacyPolicy}
              </a>
            </div>
          </div>
          <div className="grid lg:grid-cols-3 gap-10 items-start">
            {navigationItems.map((item) => (
              <div
                key={item.title}
                className="flex text-base gap-1 flex-col items-start"
              >
                <div className="flex flex-col gap-2">
                  <p className="text-xl font-medium mb-2">{item.title}</p>
                  {item.items &&
                    item.items.map((subItem) => (
                      <a
                        key={subItem.title}
                        href={subItem.href}
                        className="text-background/75 hover:text-background transition-colors"
                      >
                        {subItem.title}
                      </a>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-20 pt-8 border-t border-background/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/60">
            {t[language].copyright}
          </p>
          <div className="flex gap-4">
            <a href="https://twitter.com" className="text-background/60 hover:text-background">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="https://github.com" className="text-background/60 hover:text-background">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="https://discord.com" className="text-background/60 hover:text-background">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}