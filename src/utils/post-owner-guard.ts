import { NextFunction, Request, Response } from 'express';
import db from '../db';
import { posts } from '@/db/schema';
import { eq } from 'drizzle-orm';

const postOwnerGuard = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    res.status(401).json({ msg: 'Unauthorized' });
    return;
  }

  const { id } = req.params;
  const { userId } = req.session;

  switch (req.method) {
    case 'POST':
      next();
      return;
    case 'PUT':
    case 'DELETE':
      if (!id) {
        res.status(400).json({ msg: 'Missing post id' });
        return;
      }
      const [post] = await db.select().from(posts).where(eq(posts.id, id));
      if (!post) {
        res.status(404).json({ msg: 'Post not found' });
        return;
      }
      if (post.userId !== userId) {
        res.status(403).json({ msg: 'Forbidden' });
        return;
      }
      next();
      return;
    default:
      res.status(405).json({ msg: 'Method not allowed' });
      return;
  }
};

export default postOwnerGuard;
