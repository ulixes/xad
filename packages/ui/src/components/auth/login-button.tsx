import { LogIn, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LoginButtonProps {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export function LoginButton({ 
  onClick, 
  loading = false, 
  disabled = false, 
  className,
  children = "Login with Privy"
}: LoginButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn("w-full", className)}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Authenticating...
        </>
      ) : (
        <>
          <LogIn className="mr-2 h-4 w-4" />
          {children}
        </>
      )}
    </Button>
  )
}