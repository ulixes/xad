import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import EarningsCalculator from './EarningsCalculator';

export default function Feature2() {
  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto">
        <div className="grid border rounded-lg container py-8 grid-cols-1 gap-8 items-center lg:grid-cols-2">
          <div className="flex gap-10 flex-col">
            <div className="flex gap-4 flex-col">
              <div>
                <Badge variant="outline">For Users</Badge>
              </div>
              <div className="flex gap-2 flex-col">
                <h2 className="text-3xl lg:text-5xl tracking-tighter max-w-xl text-left font-regular">
                  Turn Your Likes Into Income
                </h2>
                <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-xl text-left">
                  Earn crypto for genuine social media engagement. Our AI matches you with content you'll actually enjoy promoting.
                </p>
              </div>
            </div>
            <div className="grid lg:pl-6 grid-cols-1 sm:grid-cols-3 items-start lg:grid-cols-1 gap-6">
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>Highest Payouts</p>
                  <p className="text-muted-foreground text-sm">
                    Up to $0.52 per like and $5 per comment with verified actions.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>Instant Crypto Cashouts</p>
                  <p className="text-muted-foreground text-sm">
                    Get paid immediately in crypto with near-zero fees.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>Privacy Protected</p>
                  <p className="text-muted-foreground text-sm">
                    Zero-knowledge proofs ensure your data stays private.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <EarningsCalculator />
            <p className="text-sm text-muted-foreground text-center">
              Calculate your potential monthly earnings based on your social media activity
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}