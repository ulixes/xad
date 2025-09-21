import { useState } from 'react'

export default function FAQ() {
  const [language] = useState<'en' | 'zh'>(() => {
    return (localStorage.getItem('locale') as 'en' | 'zh') || 'en'
  })


  const faqs = {
    en: [
      {
        question: "How do users get paid?",
        answer: "Install the Chrome extension, connect your social media accounts, and earn crypto."
      },
      {
        question: "How you ensure these accounts aren't bots?",
        answer: "We use self.xyz's \"Proof of Humanity\" to check that the social media account owner is a single unique human. You never pay for botted engagement."
      },
      {
        question: "Will you support more social media platforms?",
        answer: "Yes. Instagram, Reddit, and X are all on our roadmap."
      },
      {
        question: "Will you support commenting, sharing, and posting?",
        answer: "Yes."
      },
      {
        question: "What social platforms are supported?",
        answer: "X (Twitter), Reddit, Instagram, YouTube, Facebook, Farcaster, Douyin/TikTok, XiaoHongShu, and more coming soon."
      },
      {
        question: "How much can I earn?",
        answer: "It depends which brands want you to engage with their content, but your time will always be well spent."
      },
      {
        question: "Any costs for users?",
        answer: "Free to join and use – just your time engaging genuinely."
      },
      {
        question: "Where can I download the extension?",
        answer: "Coming soon."
      },
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
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          {/* Section Header */}
          <div className="mb-8">
            <h4 className="text-3xl md:text-5xl tracking-tighter font-regular text-left">
              FAQ
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
    </section>
  )
}