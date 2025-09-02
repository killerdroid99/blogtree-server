import 'dotenv/config';
import express from 'express';
import db from './db';
import { posts } from './db/schema';
import { eq, desc } from 'drizzle-orm';
import authGuard from './utils/auth-guard';
import z from 'zod';

const postsRouter = express();

// routes that dont require auth
postsRouter.get('/', async (req, res) => {
  const [allPosts] = await db.select().from(posts).orderBy(desc(posts.createdAt));
  res.json({ posts: allPosts });
  return;
});

postsRouter.get('/:id', async (req, res) => {
  const { id } = req.params;

  const [post] = await db.select().from(posts).where(eq(posts.id, id));

  if (!post) {
    res.status(404).json({ msg: 'Post not found' });
    return;
  }

  res.json({ post });
  return;
});

// routes that require auth
postsRouter.use(authGuard);

postsRouter.post('/', async (req, res) => {
  const Schema = z.object({
    title: z.string().min(10).max(100),
    content: z.string().min(50)
  });

  const { data, success, error } = Schema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({ msg: z.flattenError(error).fieldErrors });
  }
  await db.insert(posts).values({ ...data, userId: req.session.userId! });
  res.status(201).json({ msg: 'success' });
  return;
});

postsRouter.put('/:id', async (req, res) => {
  const { id } = req.params;

  const [post] = await db.select().from(posts).where(eq(posts.id, id));

  if (!post) {
    res.status(404).json({ msg: 'Post not found' });
    return;
  }

  if (post.userId !== req.session.userId) {
    res.status(401).json({ msg: 'Unauthorized' });
    return;
  }

  const Schema = z.object({
    title: z.string().min(10).max(100),
    content: z.string().min(50)
  });

  const { data, success, error } = Schema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({ msg: z.flattenError(error).fieldErrors });
  }
  await db
    .update(posts)
    .set({ ...data, userId: req.session.userId! })
    .where(eq(posts.id, id));
  res.status(200).json({ msg: 'success' });
  return;
});

postsRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const [post] = await db.select().from(posts).where(eq(posts.id, id));

  if (!post) {
    res.status(404).json({ msg: 'Post not found' });
    return;
  }

  if (post.userId !== req.session.userId) {
    res.status(401).json({ msg: 'Unauthorized' });
    return;
  }

  await db.delete(posts).where(eq(posts.id, id));
  res.status(200).json({ msg: 'success' });
  return;
});

export default postsRouter;
