import { MoveRight, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function CTA2() {
  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto">
        <div className="flex flex-col text-center bg-muted rounded-md p-4 lg:p-14 gap-8 items-center">
          <div>
            <Badge>Get Started Today</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular">
              Ready to Transform Your Advertising?
            </h3>
            <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-xl">
              Join thousands of users earning from authentic engagement and brands reaching real audiences. 
              No bots, no fraud, just genuine connections powered by zero-knowledge technology.
            </p>
          </div>
          <div className="flex flex-row gap-4">
            <Button className="gap-4">
              Start Earning <MoveRight className="w-4 h-4" />
            </Button>
            <Button className="gap-4" variant="outline">
              Start Advertising <Target className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}