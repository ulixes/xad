import { AlertCircle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface ErrorDisplayProps {
  error: string | Error
  title?: string
  onRetry?: () => void
  className?: string
}

export function ErrorDisplay({ 
  error, 
  title = "Something went wrong", 
  onRetry, 
  className 
}: ErrorDisplayProps) {
  const errorMessage = error instanceof Error ? error.message : error

  return (
    <Card className={cn("border-destructive/20", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="break-words">
            {errorMessage}
          </AlertDescription>
        </Alert>

        {onRetry && (
          <Button 
            onClick={onRetry} 
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}