import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export default function FAQ2() {
  const faqs = [
    {
      question: "How does zkad ensure authentic engagement?",
      answer: "zkad uses zero-knowledge proofs to verify that users are real without exposing their personal data. Our AI matching system ensures users only see content aligned with their genuine interests based on their account history, preventing fake or forced promotions."
    },
    {
      question: "How much can I earn as a user?",
      answer: "Earnings depend on your engagement quality and volume. Verified actions earn higher rates - up to $0.52 per like and $5 per comment. Active users typically earn $50-500 per month, with top performers earning more through our bonus programs and daily lottery system."
    },
    {
      question: "How does the privacy protection work?",
      answer: "We use zkPass technology and zero-knowledge proofs to verify user attributes without accessing personal data. Your social media credentials are never stored on our servers, and brands cannot see individual user information - only aggregated, verified audience metrics."
    },
    {
      question: "What makes zkad different from other influencer platforms?",
      answer: "zkad combines the scale of traditional ad platforms with the authenticity of micro-influencer marketing. Unlike other platforms, we use zero-knowledge proofs to guarantee bot-free engagement, instant crypto payments, and complete privacy protection for users."
    },
    {
      question: "How do brands target their audience?",
      answer: "Brands use our privacy-preserving targeting system to define audiences based on verified attributes like location, interests, and demographics. The targeting happens through zero-knowledge proofs, meaning user data is never exposed while still ensuring accurate audience matching."
    },
    {
      question: "What cryptocurrencies are supported?",
      answer: "We support major cryptocurrencies including USDC, USDT, and ETH on multiple chains for both user payouts and brand payments. Transactions are instant with minimal fees, and users can withdraw anytime without minimum thresholds."
    },
    {
      question: "Is the Chrome extension safe to use?",
      answer: "Yes, our Chrome extension is open-source and has been audited for security. It only accesses the minimum required permissions, never stores passwords, and all sensitive operations happen locally in your browser using zero-knowledge cryptography."
    },
    {
      question: "How does the daily lottery system work?",
      answer: "Users earn lottery tickets by completing daily engagement tasks. Each ticket enters you into our Megapot drawing with prizes up to $1M. Winners are selected transparently on-chain, and prizes are paid instantly in crypto."
    }
  ];

  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto">
        <div className="flex flex-col gap-10">
          <div className="flex text-center justify-center items-center gap-4 flex-col">
            <Badge variant="outline">FAQ</Badge>
            <div className="flex gap-2 flex-col">
              <h4 className="text-3xl md:text-5xl tracking-tighter max-w-xl text-center font-regular">
                Frequently Asked Questions
              </h4>
              <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-xl text-center">
                Everything you need to know about zkad's authentic advertising platform. 
                Can't find what you're looking for? Reach out to our support team.
              </p>
            </div>
            <div>
              <Button className="gap-4" variant="outline">
                Contact Support <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="max-w-3xl w-full mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={"index-" + index}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}