import { Loader2, Shield, ShieldCheck, ShieldX, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type AuthState = "idle" | "authenticating" | "authenticated" | "creatingWallet" | "signingMessage" | "error"

interface AuthStateIndicatorProps {
  state: AuthState
  className?: string
}

export function AuthStateIndicator({ state, className }: AuthStateIndicatorProps) {
  const stateConfig = {
    idle: {
      icon: Shield,
      label: "Ready",
      variant: "secondary" as const,
      className: "text-muted-foreground",
      animate: false
    },
    authenticating: {
      icon: Loader2,
      label: "Authenticating",
      variant: "outline" as const,
      className: "text-blue-600 dark:text-blue-400",
      animate: true
    },
    authenticated: {
      icon: ShieldCheck,
      label: "Authenticated",
      variant: "secondary" as const,
      className: "text-green-600 dark:text-green-400",
      animate: false
    },
    creatingWallet: {
      icon: Loader2,
      label: "Creating Wallet",
      variant: "outline" as const,
      className: "text-orange-600 dark:text-orange-400",
      animate: true
    },
    signingMessage: {
      icon: Loader2,
      label: "Signing Message",
      variant: "outline" as const,
      className: "text-purple-600 dark:text-purple-400",
      animate: true
    },
    error: {
      icon: ShieldX,
      label: "Error",
      variant: "destructive" as const,
      className: "text-red-600 dark:text-red-400",
      animate: false
    }
  }

  const config = stateConfig[state]
  const Icon = config.icon

  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        "flex items-center gap-1.5 px-3 py-1 clay-shadow-sm",
        config.className,
        className
      )}
    >
      <Icon className={cn(
        "h-3 w-3",
        config.animate && "animate-spin"
      )} />
      {config.label}
    </Badge>
  )
}