import z from 'zod';

export const postSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(100, 'Title must not exceed 100 characters'),
  content: z.string().min(50, 'Content must be at least 50 characters')
});
