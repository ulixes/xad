import { User, Mail, Wallet } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface UserProfileProps {
  email?: string
  walletAddress?: string
  avatarUrl?: string
  className?: string
}

export function UserProfile({ 
  email, 
  walletAddress, 
  avatarUrl, 
  className 
}: UserProfileProps) {
  const displayName = email || walletAddress
  const initials = email 
    ? email.substring(0, 2).toUpperCase()
    : walletAddress?.substring(0, 2).toUpperCase() || "U"

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-primary/10">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">
              {email ? "Authenticated User" : "Wallet User"}
            </h3>
            <Badge variant="secondary" className="mt-1">
              Connected
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{email}</span>
          </div>
        )}
        {walletAddress && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4" />
            <span className="font-mono">{formatAddress(walletAddress)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}