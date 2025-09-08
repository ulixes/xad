import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

export default function ForBrands() {
  const [language] = useState<'en' | 'zh'>(() => {
    return (localStorage.getItem('locale') as 'en' | 'zh') || 'en'
  })

  const steps = {
    en: [
      {
        number: "1",
        title: "Build Your Campaign",
        description: "Fill out our simple targeting form to define your audience using verified attributes like location, interests, or demographics.",
        icon: "target"
      },
      {
        number: "2",
        title: "Fund Your Ads",
        description: "Send crypto to our ad engine – instant setup, low fees.",
        icon: "wallet"
      },
      {
        number: "3",
        title: "Scale Effortlessly",
        description: "Get the volume of microinfluencers with the precision of big ad platforms.",
        icon: "trending"
      },
      {
        number: "4",
        title: "Reputable Results",
        description: "Work with large brands for high-paying, bot-free promotions.",
        icon: "shield"
      }
    ],
    zh: [
      {
        number: "1",
        title: "构建您的广告活动",
        description: "填写我们简单的定向表单，使用经过验证的属性（如位置、兴趣或人口统计）来定义您的受众。",
        icon: "target"
      },
      {
        number: "2",
        title: "为您的广告提供资金",
        description: "向我们的广告引擎发送加密货币 - 即时设置，低费用。",
        icon: "wallet"
      },
      {
        number: "3",
        title: "轻松扩展",
        description: "获得微影响者的数量和大型广告平台的精准度。",
        icon: "trending"
      },
      {
        number: "4",
        title: "可靠的结果",
        description: "与大品牌合作，进行高薪、无机器人的推广。",
        icon: "shield"
      }
    ]
  }

  const benefits = {
    en: [
      "No Grifting: AI ensures users only promote what fits their style",
      "Privacy-Preserving: zkPass technology for secure targeting",
      "Bot-Free: Zero-knowledge proofs verify real users",
      "Instant Setup: Fund with crypto and start immediately",
      "Scale: Reach millions through authentic engagements"
    ],
    zh: [
      "无虚假推广：AI 确保用户只推广符合其风格的内容",
      "保护隐私：zkPass 技术实现安全定向",
      "无机器人：零知识证明验证真实用户",
      "即时设置：使用加密货币付款并立即开始",
      "规模化：通过真实互动触达数百万用户"
    ]
  }

  const t = {
    en: {
      title: "For Brands: Targeted Ads Without the Hassle",
      subtitle: "Advertise to Genuine Microinfluencers",
      description: "Reach millions through authentic engagements from verified users. Use our privacy-preserving targeting to find the perfect audience – no data leaks, all powered by zkPass.",
      howItWorks: "How It Works for Brands:",
      whyChoose: "Why Choose zkad for Your Brand",
      exampleTargeting: "Example Targeting: Young music fans in the USA who follow specific artists.",
      fillFormCta: "Start Campaign",
      viewSourceCta: "View Code",
      getStarted: "Ready to reach authentic audiences at scale?"
    },
    zh: {
      title: "品牌端：无障碍定向广告",
      subtitle: "向真实的微影响者投放广告",
      description: "通过经过验证的用户的真实互动触达数百万人。使用我们的隐私保护定向技术找到完美的受众 - 无数据泄露，全部由 zkPass 提供支持。",
      howItWorks: "品牌操作流程：",
      whyChoose: "为什么选择 zkad 为您的品牌服务",
      exampleTargeting: "定向示例：美国关注特定艺术家的年轻音乐爱好者。",
      fillFormCta: "开始活动",
      viewSourceCta: "查看代码",
      getStarted: "准备好大规模触达真实受众了吗？"
    }
  }

  return (
    <section id="for-brands" className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header - Outside background */}
        <div className="mb-12 text-left">
          <div className="inline-flex items-center px-3 py-1.5 mb-6 bg-primary/10 border border-primary/20 rounded-full">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              {language === 'en' ? 'FOR BRANDS' : '品牌端'}
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
            {language === 'en' ? 'Manage microinfluencers at scale' : '大规模管理微影响者'}
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl">
            {t[language].description}
          </p>
        </div>
        
        {/* Content Card */}
        <div className="bg-card rounded-2xl p-8 lg:p-12">

        {/* How It Works Steps */}
        <div className="mb-16">
          <h4 className="text-2xl font-semibold text-center mb-10">{t[language].howItWorks}</h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps[language].map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-card rounded-xl p-6 border-2 border-border hover:border-primary transition-colors h-full">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl mr-3">
                      {step.number}
                    </div>
                    {step.icon === 'target' && (
                      <svg className="h-6 w-6 text-accent-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="12" r="6"/>
                        <circle cx="12" cy="12" r="2"/>
                      </svg>
                    )}
                    {step.icon === 'wallet' && (
                      <svg className="h-6 w-6 text-accent-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
                        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
                        <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
                      </svg>
                    )}
                    {step.icon === 'trending' && (
                      <svg className="h-6 w-6 text-accent-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                        <polyline points="17 6 23 6 23 12"/>
                      </svg>
                    )}
                    {step.icon === 'shield' && (
                      <svg className="h-6 w-6 text-accent-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M12 2l7 3v8c0 3.3-2.7 8-7 9-4.3-1-7-5.7-7-9V5z"/>
                        <polyline points="9 12 12 15 16 10"/>
                      </svg>
                    )}
                  </div>
                  <h5 className="font-semibold text-lg mb-2">{step.title}</h5>
                  <p className="text-base text-muted-foreground">{step.description}</p>
                </div>
                {index < steps[language].length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Two Column Layout: Benefits and Form */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Left: Benefits */}
          <div>
            <h4 className="text-xl font-semibold mb-6">{t[language].whyChoose}</h4>
            <div className="space-y-4">
              {benefits[language].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-accent-foreground mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <p className="text-muted-foreground">{benefit}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-6 bg-primary/5 rounded-xl border border-primary/20">
              <p className="text-base font-semibold text-foreground mb-2">Example Campaign:</p>
              <p className="text-muted-foreground">{t[language].exampleTargeting}</p>
            </div>
          </div>

          {/* Right: Targeting Form Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Simple Targeting Builder</CardTitle>
                <CardDescription>
                  Define your audience with privacy-preserving attributes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-secondary/10 rounded-lg border border-border">
                    <svg className="h-4 w-4 text-accent-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-base">Location: United States</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-secondary/10 rounded-lg border border-border">
                    <svg className="h-4 w-4 text-accent-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-base">Age: 18-34</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-secondary/10 rounded-lg border border-border">
                    <svg className="h-4 w-4 text-accent-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <span className="text-base">Interests: Music, Hip-Hop</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-secondary/10 rounded-lg border border-border">
                    <svg className="h-4 w-4 text-accent-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-base">Verified: 2+ Year Account</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-base text-muted-foreground mb-3">Estimated Reach:</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-foreground">2.5M+</span>
                    <span className="text-base text-muted-foreground">matching users</span>
                  </div>
                </div>
                <Button className="w-full">
                  Start Campaign
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section - Max 2 buttons */}
        <div className="text-center bg-card rounded-2xl p-12 mt-12">
          <p className="text-xl text-foreground mb-8">
            {t[language].getStarted}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="font-semibold text-lg px-8 py-6"
            >
              {t[language].fillFormCta}
            </Button>
          </div>
        </div>
        </div>
      </div>
    </section>
  )
}