import { useParams, Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft, Twitter, Copy, CheckCircle } from 'lucide-react';
import { Suspense, useState } from 'react';
import '../styles/blog.css';

// Import all blog posts
const posts = import.meta.glob('../blog/posts/*.mdx', { eager: true });

// Create a map of slugs to components
const postComponents: Record<string, any> = {};
const postMeta: Record<string, any> = {};

Object.entries(posts).forEach(([path, module]: [string, any]) => {
  const slug = path.split('/').pop()?.replace('.mdx', '') || '';
  postComponents[slug] = module.default || module;
  postMeta[slug] = module.meta;
});

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [copied, setCopied] = useState(false);
  
  if (!slug || !postComponents[slug]) {
    return <Navigate to="/blog" replace />;
  }

  const PostContent = postComponents[slug];
  const meta = postMeta[slug];

  const handleShare = async (platform: 'twitter' | 'copy') => {
    const url = window.location.href;
    
    if (platform === 'twitter') {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(meta.title)}&url=${encodeURIComponent(url)}`,
        '_blank'
      );
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link 
          to="/blog" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Article Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {meta.title}
          </h1>
          
          <p className="text-xl text-muted-foreground mb-6">
            {meta.description}
          </p>
          
          <div className="flex items-center justify-between gap-4 pb-8 border-b border-border/50">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {new Date(meta.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('twitter')}
                  className="hover:bg-primary/10"
                >
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('copy')}
                  className="hover:bg-primary/10"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
          </div>
        </header>

        {/* Article Content */}
        <article className="mdx-content">
          <Suspense fallback={<div>Loading...</div>}>
            <PostContent />
          </Suspense>
        </article>
      </div>
    </div>
  );
}