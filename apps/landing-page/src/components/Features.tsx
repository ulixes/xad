// Icons as inline SVGs to avoid import issues
import { useState } from 'react'

export default function Features() {
  const [language] = useState<'en' | 'zh'>(() => {
    return (localStorage.getItem('locale') as 'en' | 'zh') || 'en'
  })

  const t = {
    en: {
      title: "Why Choose Xadvo?",
      subtitle: "The most trusted platform for earning crypto through social media engagement",
      features: [
        {
          icon: 'dollar',
          title: "Highest Pay",
          description: "Because we combat scammers, bots, and bad actors by using zero-knowledge proofs to verify your accounts and actions, we can offer the highest payouts in the industry."
        },
        {
          icon: 'zap',
          title: "Fast Crypto Cashouts",
          description: "Unlike bank transfers or PayPal, when you cash out on Xadvo, you get your money instantly. No waiting, almost zero fees."
        },
        {
          icon: 'award',
          title: "Reputable Brands",
          description: "We work with large brands and companies to find the best high-paying opportunities."
        },
        {
          icon: 'shield',
          title: "We Value Privacy", 
          description: "Get paid in crypto ensure your payouts remain private. We do not share or make public which accounts do which actions."
        },
        {
          icon: 'gift',
          title: "Fun Lottery Prizes",
          description: "Do small daily tasks for a chance to win the $1M Megapot lottery. As we get started, we want you to come back daily to check if you have any new tasks available."
        },
        {
          icon: 'check',
          title: "No Grifting",
          description: "We use AI to analyze your account history to match it to available promotional opportunities. This ensures that users are never promoting a product they wouldn't otherwise promote."
        }
      ]
    },
    zh: {
      title: "为什么选择 Xadvo？",
      subtitle: "通过社交媒体互动赚取加密货币的最可信赖平台",
      features: [
        {
          icon: 'dollar',
          title: "最高报酬",
          description: "我们使用零知识证明来验证您的账户和操作，有效打击诈骗者、机器人和恶意行为者，因此能够提供业内最高的报酬。"
        },
        {
          icon: 'zap',
          title: "快速加密货币提现",
          description: "与银行转账或 PayPal 不同，在 Xadvo 提现时，您可以立即收到资金。无需等待，几乎零手续费。"
        },
        {
          icon: 'award',
          title: "知名品牌",
          description: "我们与大型品牌和公司合作，为您寻找最佳的高薪机会。"
        },
        {
          icon: 'shield',
          title: "重视隐私", 
          description: "使用加密货币支付确保您的收益保持私密。我们不会分享或公开哪些账户执行了哪些操作。"
        },
        {
          icon: 'gift',
          title: "有趣的抽奖奖品",
          description: "完成小型日常任务，有机会赢得 100 万美元大奖。在我们起步阶段，希望您每天回来查看是否有新任务。"
        },
        {
          icon: 'check',
          title: "无虚假推广",
          description: "我们使用 AI 分析您的账户历史，将其与可用的推广机会进行匹配。这确保用户永远不会推广他们原本不会推广的产品。"
        }
      ]
    }
  }
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t[language].title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t[language].subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {t[language].features.map((feature, index) => (
              <div 
                key={index}
                className="group relative p-8 bg-card rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-border"
              >
                <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative">
                  <div className="inline-flex p-3 bg-primary rounded-lg text-primary-foreground mb-4">
                    {feature.icon === 'dollar' && (
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <line x1="12" y1="1" x2="12" y2="23"/>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                    )}
                    {feature.icon === 'shield' && (
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M12 2l7 3v8c0 3.3-2.7 8-7 9-4.3-1-7-5.7-7-9V5z"/>
                      </svg>
                    )}
                    {feature.icon === 'zap' && (
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                    )}
                    {feature.icon === 'globe' && (
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                    )}
                    {feature.icon === 'users' && (
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    )}
                    {feature.icon === 'trending' && (
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                        <polyline points="17 6 23 6 23 12"/>
                      </svg>
                    )}
                    {feature.icon === 'award' && (
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="7"/>
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                      </svg>
                    )}
                    {feature.icon === 'gift' && (
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <polyline points="20 12 20 22 4 22 4 12"/>
                        <rect x="2" y="7" width="20" height="5"/>
                        <line x1="12" y1="22" x2="12" y2="7"/>
                        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                      </svg>
                    )}
                    {feature.icon === 'check' && (
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-card-foreground mb-2">
                    {feature.title}
                  </h3>
                  
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
          ))}
        </div>
      </div>
    </section>
  )
}