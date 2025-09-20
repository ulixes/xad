// Icons as inline SVGs

const steps = [
  {
    icon: 'download',
    number: "1",
    title: "Install Extension",
    description: "Add zkAd to your Chrome or Firefox browser in one click"
  },
  {
    icon: 'heart',
    number: "2", 
    title: "Engage Naturally",
    description: "Like, comment, and follow on your favorite social platforms"
  },
  {
    icon: 'wallet',
    number: "3",
    title: "Earn Rewards",
    description: "Receive crypto payments directly to your wallet"
  }
]

export default function HowItWorks() {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start earning in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-1 bg-primary/30 -translate-y-1/2"></div>
          
          {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-card rounded-2xl p-8 shadow-md border-2 border-border relative z-10">
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                        {step.icon === 'download' && (
                          <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                        )}
                        {step.icon === 'heart' && (
                          <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                        )}
                        {step.icon === 'wallet' && (
                          <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
                            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
                            <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/>
                          </svg>
                        )}
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-base border-2 border-border">
                        {step.number}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-card-foreground mb-3 text-center">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-center">
                    {step.description}
                  </p>
                </div>
              </div>
          ))}
        </div>
      </div>
    </section>
  )
}