import { Wallet, Copy, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface WalletInfo {
  id: string
  address: string
  type: "embedded" | "external"
  balance?: string
}

interface WalletListProps {
  wallets: WalletInfo[]
  onCopyAddress: (address: string) => void
  onViewExternal?: (address: string) => void
  className?: string
}

export function WalletList({ 
  wallets, 
  onCopyAddress, 
  onViewExternal, 
  className 
}: WalletListProps) {
  const formatAddress = (address: string) => {
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`
  }

  if (wallets.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No wallets connected</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("clay-shadow", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connected Wallets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {wallets.map((wallet, index) => (
          <div key={wallet.id}>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm">{formatAddress(wallet.address)}</span>
                  <Badge variant={wallet.type === "embedded" ? "secondary" : "outline"} className="text-xs">
                    {wallet.type}
                  </Badge>
                </div>
                {wallet.balance && (
                  <p className="text-xs text-muted-foreground">{wallet.balance} ETH</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCopyAddress(wallet.address)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy address</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {onViewExternal && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewExternal(wallet.address)}
                          className="h-8 w-8 p-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View on explorer</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            {index < wallets.length - 1 && <Separator className="my-2" />}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}