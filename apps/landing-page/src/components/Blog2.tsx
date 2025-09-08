import { MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Blog2() {
  const articles = [
    {
      title: "Zero-Knowledge Advertising Explained",
      description: "Learn how zkad uses cryptographic proofs to verify users without compromising privacy.",
      category: "Technology",
      readTime: "5 min read",
      image: "/api/placeholder/400/300"
    },
    {
      title: "Maximizing Your Social Media Earnings",
      description: "Tips and strategies to increase your earnings through authentic engagement on zkad.",
      category: "User Guide",
      readTime: "3 min read",
      image: "/api/placeholder/400/300"
    },
    {
      title: "The Future of Bot-Free Advertising",
      description: "How zero-knowledge proofs are revolutionizing digital advertising authenticity.",
      category: "Industry",
      readTime: "7 min read",
      image: "/api/placeholder/400/300"
    },
    {
      title: "Case Study: 10x ROI with zkad",
      description: "How a fashion brand achieved unprecedented engagement rates with verified audiences.",
      category: "Case Study",
      readTime: "4 min read",
      image: "/api/placeholder/400/300"
    }
  ];

  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto flex flex-col gap-14">
        <div className="flex w-full flex-col sm:flex-row sm:justify-between sm:items-center gap-8">
          <h4 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular">
            Latest from the Blog
          </h4>
          <Button className="gap-4">
            View All Articles <MoveRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {articles.map((article, index) => (
            <div key={index} className="flex flex-col gap-2 hover:opacity-75 cursor-pointer transition-opacity">
              <div className="bg-muted rounded-md aspect-video mb-4"></div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <span>{article.category}</span>
                <span>•</span>
                <span>{article.readTime}</span>
              </div>
              <h3 className="text-xl tracking-tight font-medium">{article.title}</h3>
              <p className="text-muted-foreground text-base">
                {article.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}