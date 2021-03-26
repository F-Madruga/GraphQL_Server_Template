import 'reflect-metadata';
import 'dotenv-safe/config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { createConnection } from 'typeorm';
import path from 'path';
import Redis from 'ioredis';
import connectRedis from 'connect-redis';
import session from 'express-session';
import * as jf from 'joiful';
import { prod } from './constants';
import { UserResolver } from './resolvers/user';
import { User } from './entities/User';
import logger from './utils/logger';

export const createHttpServer = async (RedisStore: connectRedis.RedisStore, redis: Redis.Redis) => {
  const app = express();

  app.use(
    session({
      name: process.env.COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: 'lax', // csrf
        secure: prod, // cookie only works in https
        // domain: prod ? ".codeponder.com" : undefined,
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      resave: false,
    }),
  );

  return app;
};

export const createApolloServer = async (redis: Redis.Redis) => new ApolloServer({
  schema: await buildSchema({
    resolvers: [UserResolver],
    validate: (argValue: any) => {
      const { error } = jf.validate(argValue);
      if (error) {
        throw error;
      }
    },
  }),
  context: ({ req, res }) => ({
    req,
    res,
    redis,
  }),
});

export const createRedisStore = () => connectRedis(session);

export const createRedisClient = () => new Redis(process.env.REDIS_URL);

export const createDatabaseConnection = async () => createConnection({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  logging: process.env.NODE_ENV !== 'test',
  dropSchema: process.env.NODE_ENV === 'test',
  synchronize: true,
  // synchronize: process.env.NODE_ENV !== 'test',
  migrations: [path.join(__dirname, './migrations/*')],
  entities: [User],
});

const main = async () => {
  await createDatabaseConnection();

  // await databaseConnection.runMigrations();
  const RedisStore = createRedisStore();
  const redis = createRedisClient();

  const apolloServer = await createApolloServer(redis);

  const app = await createHttpServer(RedisStore, redis);

  apolloServer.applyMiddleware({ app });

  app.listen(process.env.SERVER_PORT, () => {
    logger.info(`server started on localhost:${process.env.SERVER_PORT}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  main().catch((err) => {
    logger.error(err);
  });
}
