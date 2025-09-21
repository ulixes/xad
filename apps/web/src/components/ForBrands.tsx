import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import RotatingText from './ui/RotatingText'
import CountUp from './ui/CountUp'

export default function ForBrands() {
  const navigate = useNavigate()
  const [language] = useState<'en' | 'zh'>(() => {
    return (localStorage.getItem('locale') as 'en' | 'zh') || 'en'
  })

  // Define rotating text variations - matched by index
  const platforms = ['TikTok', 'Instagram', 'Reddit', 'X', 'Facebook']
  const criteria = ['1M+ views', '10K+ followers', 'Top 25%', '5+ years', 'Verified']
  const locations = ['🇺🇸', '🇬🇧', '🌍', '🇨🇦', '🇪🇺']
  const prices = [0.25, 0.50, 0.03, 0.15, 0.10]
  const actions = ['per comment', 'per follow', 'per upvote', 'per post', 'per like']

  // Track current index for syncing all elements
  const [currentIndex, setCurrentIndex] = useState(0)
  const [previousIndex, setPreviousIndex] = useState(0)

  // Create refs for each RotatingText component
  const platformRef = useRef<any>(null)
  const criteriaRef = useRef<any>(null)
  const locationRef = useRef<any>(null)
  const actionRef = useRef<any>(null)

  // Manually control sequential rotation
  useEffect(() => {
    const interval = setInterval(() => {
      // Change them in sequence with delays
      if (platformRef.current) platformRef.current.next()
      setTimeout(() => {
        if (criteriaRef.current) criteriaRef.current.next()
      }, 1000)
      setTimeout(() => {
        if (locationRef.current) locationRef.current.next()
      }, 2000)
      setTimeout(() => {
        // Update index for price animation
        setPreviousIndex(currentIndex)
        setCurrentIndex(prev => (prev + 1) % prices.length)
      }, 3000)
      setTimeout(() => {
        if (actionRef.current) actionRef.current.next()
      }, 3500)
    }, 8000)

    return () => clearInterval(interval)
  }, [currentIndex, prices.length])

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
            {language === 'en' ? 'Manage micro-influencers at scale' : '大规模管理微影响者'}
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl">
            {language === 'en' 
              ? 'Your products promoted by thousands of real users. Set your targeting, choose your price, and watch authentic engagements roll in.'
              : '您的产品由数千名真实用户推广。设置您的定向，选择您的价格，观看真实的参与度滚滚而来。'}
          </p>
        </div>
        
        {/* Content Card */}
        <div className="bg-card rounded-2xl p-8 lg:p-12">
          {/* Animated Campaign Examples */}
          <div className="space-y-8">
            <div className="bg-secondary/10 rounded-xl border border-border p-8 min-h-[280px]">
              <div className="text-center mb-8">
                <h3 className="text-2xl md:text-3xl font-bold flex flex-wrap justify-center items-center gap-2">
                  <div className="inline-flex items-center justify-center w-[180px] h-[48px] px-4 bg-orange-500/20 text-orange-600 rounded-lg border border-orange-500/30">
                    <RotatingText
                      ref={platformRef}
                      texts={platforms}
                      mainClassName="whitespace-nowrap"
                      splitBy="words"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ type: "spring", damping: 30, stiffness: 300 }}
                      auto={false}
                    />
                  </div>
                  <span className="whitespace-nowrap">accounts with</span>
                  <div className="inline-flex items-center justify-center w-[300px] h-[48px] px-4 bg-purple-500/20 text-purple-600 rounded-lg border border-purple-500/30">
                    <RotatingText
                      ref={criteriaRef}
                      texts={criteria}
                      mainClassName="whitespace-nowrap"
                      splitBy="words"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ type: "spring", damping: 30, stiffness: 300 }}
                      auto={false}
                    />
                  </div>
                  <span className="whitespace-nowrap">in</span>
                  <div className="inline-flex items-center justify-center w-[80px] h-[48px] px-4 bg-green-500/20 text-green-600 rounded-lg border border-green-500/30">
                    <span className="text-2xl">
                      <RotatingText
                        ref={locationRef}
                        texts={locations}
                        mainClassName="whitespace-nowrap"
                        splitBy="words"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        auto={false}
                      />
                    </span>
                  </div>
                </h3>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl md:text-6xl font-bold text-primary h-[72px] flex items-center justify-center">
                    <CountUp
                      key={currentIndex}
                      from={prices[previousIndex]}
                      to={prices[currentIndex]}
                      duration={0.4}
                      prefix="$"
                      className="tabular-nums"
                    />
                  </div>
                  <div className="text-lg text-muted-foreground mt-2 h-[28px] flex items-center justify-center">
                    <RotatingText
                      ref={actionRef}
                      texts={actions}
                      splitBy="words"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ type: "spring", damping: 30, stiffness: 300 }}
                      auto={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="font-semibold text-lg px-12 py-6"
              onClick={() => navigate('/')}
            >
              Start Campaign
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}