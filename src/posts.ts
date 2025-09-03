import 'dotenv/config';
import express from 'express';
import db from './db';
import { posts } from './db/schema';
import { eq, desc } from 'drizzle-orm';
import postOwnerGuard from './utils/post-owner-guard';
import { postSchema } from './validators/posts';
import z from 'zod';

const postsRouter = express();

// routes that dont require auth
postsRouter.get('/', async (req, res) => {
  const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt));
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
postsRouter.use(postOwnerGuard);

postsRouter.post('/', async (req, res) => {
  const { data, success, error } = postSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({ msg: z.flattenError(error).fieldErrors });
  }
  await db.insert(posts).values({ ...data, userId: req.session.userId! });
  res.status(201).json({ msg: 'success' });
  return;
});

postsRouter.put('/:id', async (req, res) => {
  const { id } = req.params;

  const { data, success, error } = postSchema.safeParse(req.body);
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

  await db.delete(posts).where(eq(posts.id, id));
  res.status(200).json({ msg: 'success' });
  return;
});

export default postsRouter;
