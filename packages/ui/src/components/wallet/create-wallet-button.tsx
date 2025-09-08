import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CreateWalletButtonProps {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  className?: string
}

export function CreateWalletButton({ 
  onClick, 
  loading = false, 
  disabled = false, 
  className 
}: CreateWalletButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      variant="outline"
      className={cn(
        "w-full",
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating Wallet...
        </>
      ) : (
        <>
          <Plus className="mr-2 h-4 w-4" />
          Create Wallet
        </>
      )}
    </Button>
  )
}