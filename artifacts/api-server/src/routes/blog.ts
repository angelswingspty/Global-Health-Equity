import { Router } from "express";
import { db } from "@workspace/db";
import { blogPostsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/blog", async (_req, res) => {
  const posts = await db
    .select()
    .from(blogPostsTable)
    .orderBy(desc(blogPostsTable.publishedAt));

  res.json(
    posts.map((p) => ({
      id: p.id,
      title: p.title,
      excerpt: p.excerpt,
      category: p.category,
      slug: p.slug,
      imageUrl: p.imageUrl,
      publishedAt: p.publishedAt.toISOString(),
    }))
  );
});

export default router;
