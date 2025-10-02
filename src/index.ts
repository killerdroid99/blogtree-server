import express from 'express';
import cors from 'cors';
import auth from './auth';
import session from 'express-session';
import connectRedis from 'connect-redis';
import Redis from 'ioredis';
import postsRouter from './posts';
import 'dotenv/config';

const app = express();
const redisClient = new Redis({
  host: process.env.REDIS_HOST!,
  port: parseInt(process.env.REDIS_PORT!)
});

const redisStore = new connectRedis({
  client: redisClient,
  disableTouch: true,
  prefix: 'session:'
});

app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ['http://localhost:5173', 'https://localhost:3000', 'http://localhost:4000'],
    credentials: true
  })
);
app.use(
  session({
    secret: 'secret',
    resave: false,
    name: 'blogtree-auth',
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    },
    store: redisStore
  })
);

app.use('/auth', auth);
app.use('/posts', postsRouter);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
