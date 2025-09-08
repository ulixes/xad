import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LogoutButtonProps {
  onClick: () => void
  disabled?: boolean
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function LogoutButton({ 
  onClick, 
  disabled = false, 
  className,
  variant = "outline"
}: LogoutButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={variant}
      size="sm"
      className={cn(
        className
      )}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  )
}