import 'dotenv/config';
import express from 'express';
import db from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import authGuard from './utils/auth-guard';
const auth = express();

auth.get('/login/google', async (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`;
  res.redirect(url);
});

auth.get('/google/callback', async (req, res) => {
  const code = req.query.code;

  const fetchRes = await fetch(
    `https://oauth2.googleapis.com/token?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&client_secret=${process.env.GOOGLE_CLIENT_SECRET}&code=${code}&grant_type=authorization_code`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  const data = (await fetchRes.json()) as { access_token: string; id_token: string };

  const fetchUser = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${data.id_token}`);

  const user = (await fetchUser.json()) as { email: string; name: string; picture: string; sub: string };

  let [existingUser] = await db.select().from(users).where(eq(users.email, user.email));
  if (existingUser) {
    req.session.userId = existingUser.id;
    console.log(req.session);

    res.redirect(process.env.FRONTEND_URL!);
    return;
  }
  const [newUser] = await db
    .insert(users)
    .values({
      name: user.name,
      email: user.email,
      provider: 'google',
      providerAccountId: user.sub,
      picture: user.picture
    })
    .returning();

  req.session.userId = newUser.id;
  console.log(req.session);

  res.redirect(process.env.FRONTEND_URL!);
  return;
});

auth.use(authGuard);

auth.get('/me', async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.session.userId!));
  res.json({ userName: user.name });
  return;
});

auth.get('/logout', async (req, res) => {
  req.session.destroy(() => {
    console.log(req.session);
    res.json({ msg: 'success' });
    return;
  });
});

export default auth;
