import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

// Import all blog posts
const posts = import.meta.glob('../blog/posts/*.mdx', { eager: true });

// Extract metadata from posts
const blogPosts = Object.entries(posts).map(([path, module]: [string, any]) => {
  const slug = path.split('/').pop()?.replace('.mdx', '') || '';
  return {
    slug,
    ...module.meta,
  };
}).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export default function Blog() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        {/* All Posts */}
        <div className="space-y-8">
          {blogPosts.map((post, index) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <Link to={`/blog/${post.slug}`} className="group block">
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="p-8">
                    <h3 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-lg text-muted-foreground mb-4">
                      {post.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      <Button variant="ghost" className="group-hover:translate-x-1 transition-transform">
                        Read
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}