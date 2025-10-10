import 'dotenv/config';
import express from 'express';
import db from './db';
import { posts, users } from './db/schema';
import { eq, desc, lt } from 'drizzle-orm';
import postOwnerGuard from './utils/post-owner-guard';
import { postSchema } from './validators/posts';
import z from 'zod';

const postsRouter = express();

// post routes that don't require auth and ownership
postsRouter.get('/', async (req, res) => {
  let { pageSize = 2, cursor } = req.query;

  console.log(cursor);

  let cursorNum;
  if (cursor && !isNaN(+cursor)) {
    cursorNum = +cursor;
  }
  const allPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      authorName: users.name,
      authorPicture: users.picture
    })
    .from(posts)
    .where(cursorNum ? lt(posts.id, cursorNum) : undefined)
    .innerJoin(users, eq(posts.userId, users.id))
    .limit(+pageSize)
    .orderBy(desc(posts.id));

  res.json({ posts: allPosts });
  return;
});

postsRouter.get('/:id', async (req, res) => {
  const { id } = req.params;

  const [post] = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      authorName: users.name,
      authorPicture: users.picture
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.id, +id));

  if (!post) {
    res.status(404).json({ msg: 'Post not found' });
    return;
  }

  res.json({ post });
  return;
});

// posts routes that require auth and ownership
postsRouter.use(postOwnerGuard);

postsRouter.post('/', async (req, res) => {
  const { data, success, error } = postSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({ msg: 'failed', errors: z.flattenError(error).fieldErrors });
  }
  const [post] = await db
    .insert(posts)
    .values({ ...data, userId: req.session.userId! })
    .returning();
  res.status(201).json({ msg: 'success', postId: post.id });
  return;
});

postsRouter.patch('/:id', async (req, res) => {
  const { id } = req.params;

  const { data, success, error } = postSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({ msg: z.flattenError(error).fieldErrors });
  }
  await db
    .update(posts)
    .set({ ...data, userId: req.session.userId! })
    .where(eq(posts.id, +id));
  res.status(200).json({ msg: 'success' });
  return;
});

postsRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  await db.delete(posts).where(eq(posts.id, +id));
  res.status(200).json({ msg: 'success' });
  return;
});

export default postsRouter;
