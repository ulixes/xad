import { useState } from 'react'

export default function FAQ() {
  const [language] = useState<'en' | 'zh'>(() => {
    return (localStorage.getItem('locale') as 'en' | 'zh') || 'en'
  })


  const faqs = {
    en: [
      {
        question: "What is zkad?",
        answer: "zkad is a platform that pays users for genuine social media engagement while letting brands advertise through micro-influencers at scale, all secured by zero-knowledge proofs."
      },
      {
        question: "How do users get paid?",
        answer: "Install the Chrome extension, connect your social accounts, and earn crypto for likes and comments on matched promotions. Payouts are instant and private."
      },
      {
        question: "Is it safe?",
        answer: "Yes – we use zk proofs to verify without exposing data. No bots, no scams, full privacy."
      },
      {
        question: "How do brands target audiences?",
        answer: "Use our form to set rules based on verified schemas (e.g., age, location, interests). Then fund with crypto for immediate activation."
      },
      {
        question: "What social platforms are supported?",
        answer: "X (Twitter), Reddit, Instagram, YouTube, Facebook, Farcaster, Douyin/TikTok, XiaoHongShu, and more coming soon."
      },
      {
        question: "Any costs for users?",
        answer: "Free to join and use – just your time engaging genuinely."
      },
      {
        question: "How to get started as a brand?",
        answer: "Fill the targeting form, send crypto, and watch engagements roll in."
      }
    ],
    zh: [
      {
        question: "什么是 zkad？",
        answer: "zkad 是一个平台，为用户的真实社交媒体互动付费，同时让品牌通过微影响者进行大规模广告投放，全部由零知识证明保护。"
      },
      {
        question: "用户如何获得报酬？",
        answer: "安装 Chrome 扩展，连接您的社交账户，通过对匹配的推广内容点赞和评论赚取加密货币。支付即时且私密。"
      },
      {
        question: "安全吗？",
        answer: "是的 - 我们使用零知识证明进行验证而不暴露数据。没有机器人，没有欺诈，完全隐私。"
      },
      {
        question: "品牌如何定向受众？",
        answer: "使用我们的表单根据经过验证的模式（例如，年龄、位置、兴趣）设置规则。然后用加密货币付款即可立即激活。"
      },
      {
        question: "支持哪些社交平台？",
        answer: "X（Twitter）、Reddit、Instagram、YouTube、Facebook、Farcaster、抖音/TikTok、小红书，更多即将推出。"
      },
      {
        question: "用户需要付费吗？",
        answer: "免费加入和使用 - 只需要您的时间进行真实互动。"
      },
      {
        question: "品牌如何开始？",
        answer: "填写定向表单，发送加密货币，然后观看互动滚滚而来。"
      }
    ]
  }

  const t = {
    en: {
      title: "FAQ",
      subtitle: "Frequently Asked Questions"
    },
    zh: {
      title: "常见问题",
      subtitle: "经常被问到的问题"
    }
  }

  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-16 lg:py-24">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="mb-8">
            <h4 className="text-3xl md:text-5xl tracking-tighter font-regular text-left">
              Frequently Asked Questions
            </h4>
          </div>

          {/* FAQ Items - Simple Accordion */}
          <div className="space-y-4">
            {faqs[language].map((faq, index) => (
              <div
                key={index}
                className="bg-card rounded-lg overflow-hidden"
              >
                <button
                  className="w-full px-6 py-4 text-left hover:bg-muted/50 transition-colors flex items-center justify-between"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  <span className="font-medium">{faq.question}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-4 text-muted-foreground">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}