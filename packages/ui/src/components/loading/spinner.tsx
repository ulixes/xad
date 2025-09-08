import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8"
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <Loader2 
      className={cn(
        "animate-spin text-primary",
        sizeClasses[size],
        className
      )} 
    />
  )
}

interface LoadingCardProps {
  message?: string
  className?: string
}

export function LoadingCard({ 
  message = "Loading...", 
  className 
}: LoadingCardProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center space-y-3 rounded-lg bg-card",
      className
    )}>
      <Spinner size="lg" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}