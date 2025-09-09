import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ChevronLeft } from "lucide-react"

interface JackpotDetailsPageProps {
  jackpotAmount: number
  hoursUntilDrawing: number
  minutesUntilDrawing: number
  dailyTasksCompleted: number
  dailyTasksRequired: number
  isEligible?: boolean
  onBack?: () => void
  className?: string
}

export function JackpotDetailsPage({
  jackpotAmount,
  hoursUntilDrawing,
  minutesUntilDrawing,
  dailyTasksCompleted = 0,
  dailyTasksRequired = 10,
  isEligible = false,
  onBack,
  className
}: JackpotDetailsPageProps) {
  const progress = (dailyTasksCompleted / dailyTasksRequired) * 100
  const isComplete = dailyTasksCompleted >= dailyTasksRequired

  return (
    <div className={cn(
      "flex flex-col h-full min-h-screen w-full max-w-sm mx-auto",
      "bg-background",
      className
    )}>
      {/* Header */}
      <div className="border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">Daily Megapot</span>
          <div className="w-8" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Megapot Amount */}
          <div className="bg-card rounded-lg p-6">
            <div className="text-center space-y-4">
              {/* Amount */}
              <div className="flex items-baseline justify-center gap-2">
                <p className="text-5xl md:text-6xl font-bold text-foreground">
                  ${jackpotAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <span className="text-xl md:text-2xl font-semibold text-muted-foreground">
                  USDC
                </span>
              </div>
              
              {/* Timer */}
              <div className="flex justify-center items-center">
                <span className="text-3xl md:text-4xl font-mono font-bold text-foreground">
                  {String(hoursUntilDrawing).padStart(2, '0')}:{String(minutesUntilDrawing).padStart(2, '0')}:00
                </span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Today's Progress</span>
              <span className={cn(
                "font-medium",
                isComplete ? "text-green-500" : "text-foreground"
              )}>
                {dailyTasksCompleted}/{dailyTasksRequired} completed
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-300",
                  isComplete ? "bg-green-500" : "bg-primary"
                )}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            {!isComplete && (
              <p className="text-xs text-muted-foreground text-center">
                Complete {dailyTasksRequired - dailyTasksCompleted} more tasks to enter today's megapot
              </p>
            )}
          </div>

          {/* View Megapot Button */}
          <Button 
            onClick={() => window.open('https://megapot.io', '_blank')}
            className="w-full"
          >
            View Megapot
          </Button>

          {/* FAQ */}
          <div className="space-y-4 pt-4">
            <h3 className="font-semibold">FAQ</h3>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How do I win?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Complete your daily tasks to be automatically entered into the daily megapot drawing. One random winner is selected before the lottery every day.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>When is the drawing?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  A winner is randomly selected every day at midnight UTC.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>How many tasks do I need to complete?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Complete {dailyTasksRequired} tasks each day to qualify for that day's megapot.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>What are the daily prizes?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <div className="space-y-2">
                    <p>Each day, $100 is awarded across multiple winners:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>One $25 prize</li>
                      <li>Five $5 prizes</li>
                      <li>Twenty-five $2 prizes</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>Do my chances increase with more tasks?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! Every 10 additional tasks completed beyond the minimum gives you an extra entry into the megapot drawing.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>How does the lottery work?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Winners earn tickets for the ${jackpotAmount.toLocaleString()} megapot lottery. Every correct completion gives you a chance at lottery tickets. Every 10 tasks = 1 additional lottery ticket.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger>Where can I see past winners?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Visit the history page to see all previous megapot winners and daily prize recipients.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  )
}