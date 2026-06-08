import React from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetBlogPosts } from "@workspace/api-client-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ArrowRight, Image as ImageIcon } from "lucide-react";
import { Link } from "wouter";

export default function Blog() {
  const { data: posts, isLoading } = useGetBlogPosts();

  return (
    <Layout>
      <section className="bg-secondary text-white py-20">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold">News & Impact</h1>
          <p className="text-xl text-white/80">
            Stories from the field, updates on our programs, and insights into global health reform.
          </p>
        </div>
      </section>

      <section className="py-20 bg-gray-50 min-h-[50vh]">
        <div className="container mx-auto px-4 md:px-6">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="border-none shadow-sm overflow-hidden">
                  <Skeleton className="w-full aspect-[16/9] rounded-none" />
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-4 w-32 mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !posts || posts.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-secondary mb-2">No posts available yet</h2>
              <p className="text-muted-foreground">Check back soon for updates from our team.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full border-none shadow-sm hover:shadow-lg transition-shadow overflow-hidden group flex flex-col">
                    <div className="w-full aspect-[16/9] bg-gray-200 relative overflow-hidden flex items-center justify-center">
                      {post.imageUrl ? (
                        <img 
                          src={post.imageUrl} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/5 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                          <ImageIcon className="w-12 h-12 text-primary/20" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-primary hover:bg-primary text-white border-none font-semibold px-3 py-1">
                          {post.category}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-6 flex-1 flex flex-col">
                      <div className="mb-4">
                        <time className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          {format(new Date(post.publishedAt), "MMMM d, yyyy")}
                        </time>
                      </div>
                      <h3 className="text-xl font-bold text-secondary leading-snug mb-3 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-muted-foreground mb-6 flex-1">
                        {post.excerpt}
                      </p>
                      <Link href={`/blog/${post.slug}`} className="inline-flex items-center text-primary font-bold hover:text-secondary transition-colors mt-auto w-fit">
                        Read Full Article
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
