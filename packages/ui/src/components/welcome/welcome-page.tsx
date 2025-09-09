import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface WelcomePageProps {
  onConnectAccounts?: () => void
  buttonText?: string
  className?: string
}

export function WelcomePage({
  onConnectAccounts,
  buttonText = "Get Started",
  className
}: WelcomePageProps) {
  return (
    <div className={cn(
      "flex flex-col h-full min-h-screen w-full max-w-sm mx-auto p-6",
      "bg-background",
      className
    )}>
      <div className="flex-1 flex flex-col justify-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Connect Accounts
          </h1>
          <p className="text-sm text-muted-foreground">
            You can add multiple accounts for each platform.
          </p>
        </div>
      </div>
      
      <div className="pb-safe">
        <Button 
          onClick={onConnectAccounts}
          size="lg"
          className="w-full"
        >
          {buttonText}
        </Button>
      </div>
    </div>
  )
}