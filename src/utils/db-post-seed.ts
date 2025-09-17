import db from '@/db';
import { posts } from '@/db/schema';

(async () => {
  for (let i = 0; i < 10; i++) {
    try {
      await db.insert(posts).values({
        title: `Test Post ${i}`,
        content: `Test Post Content ${i}`,
        userId: 'y3l5iqxlwamrn6tzax2w3qzq'
      });
    } catch (error) {
      console.error(error);
    }
  }
})();
