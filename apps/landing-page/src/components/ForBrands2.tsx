import { Check, Target, Shield, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForBrands2() {
  return (
    <div className="w-full py-20 lg:py-40 bg-secondary/20">
      <div className="container mx-auto">
        <div className="grid border rounded-lg container py-8 grid-cols-1 gap-8 items-center lg:grid-cols-2">
          <div className="flex gap-10 flex-col">
            <div className="flex gap-4 flex-col">
              <div>
                <Badge variant="outline">For Brands</Badge>
              </div>
              <div className="flex gap-2 flex-col">
                <h2 className="text-3xl lg:text-5xl tracking-tighter max-w-xl text-left font-regular">
                  Reach Real Audiences at Scale
                </h2>
                <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-xl text-left">
                  Tap into millions of verified users for authentic engagement. No bots, no fraud - just genuine connections powered by zero-knowledge proofs.
                </p>
              </div>
            </div>
            <div className="grid lg:pl-6 grid-cols-1 sm:grid-cols-3 items-start lg:grid-cols-1 gap-6">
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>Bot-Free Guarantee</p>
                  <p className="text-muted-foreground text-sm">
                    Zero-knowledge proofs verify every user is real, eliminating bot traffic completely.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>Privacy-Preserving Targeting</p>
                  <p className="text-muted-foreground text-sm">
                    Target audiences precisely without accessing personal data using zkPass technology.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-6 items-start">
                <Check className="w-4 h-4 mt-2 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>Scale of Microinfluencers</p>
                  <p className="text-muted-foreground text-sm">
                    Get the authenticity of influencer marketing with the reach of traditional ads.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Campaign Builder</CardTitle>
                <CardDescription>
                  Create your first campaign in minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border border-border">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Define Your Audience</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border border-border">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Set Your Budget</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border border-border">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Launch with Confidence</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border border-border">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Track Real Results</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Average ROI</p>
                      <p className="text-2xl font-bold text-foreground">10x</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bot Rate</p>
                      <p className="text-2xl font-bold text-foreground">0%</p>
                    </div>
                  </div>
                  <Button className="w-full">
                    Start Your Campaign
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}