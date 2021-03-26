import { Connection } from 'typeorm';
import request from 'supertest';
import { Server } from 'http';
import { ApolloServer } from 'apollo-server-express';
import connectRedis from 'connect-redis';
import Redis from 'ioredis';
import { Express } from 'express';
import { User } from '../../server/entities/User';
import {
  createHttpServer,
  createApolloServer,
  createDatabaseConnection,
  createRedisClient,
  createRedisStore,
} from '../../server/index';
import {
  registerMutation,
  loginMutation,
  meQuery,
  forgotPasswordMutation,
} from '../graphql/user';
import { extractCookies } from '../extractCookies';

let app: Express;
let server: Server;
let apolloServer: ApolloServer;
let redis: Redis.Redis;
let RedisStore: connectRedis.RedisStore;
let databaseConnection: Connection;

beforeAll(async () => {
  databaseConnection = await createDatabaseConnection();

  RedisStore = createRedisStore();
  redis = createRedisClient();

  apolloServer = await createApolloServer(redis);

  app = await createHttpServer(RedisStore, redis);

  apolloServer.applyMiddleware({ app });
  server = app.listen(process.env.SERVER_PORT);
});

afterAll(async () => {
  await databaseConnection.close();
  redis.quit();
  server.close();
});

describe('UserResolver', () => {
  describe('Register mutation', () => {
    it('valid request', async () => {
      const testUser = {
        email: 'register1@email.com',
        name: 'Register 1',
        password: '12345678',
      };

      const data = {
        query: registerMutation({
          email: testUser.email,
          name: testUser.name,
          password: testUser.password,
        }),
      };

      const res = await request(server)
        .post('/graphql')
        .send(data);

      expect(res.status).toEqual(200);
      expect(res.body).toEqual({
        data: {
          register: {
            errors: null,
            user: {
              id: 1,
              email: testUser.email,
              name: testUser.name,
            },
          },
        },
      });
      const dbUser = await User.findOne({ where: { email: testUser.email } });
      expect(dbUser).toBeDefined();
    });

    it('email already exist', async () => {
      const testUser = {
        email: 'register2@email.com',
        name: 'Register 2',
        password: '123456789',
      };

      const data = {
        query: registerMutation({
          email: testUser.email,
          name: testUser.name,
          password: testUser.password,
        }),
      };

      await request(server)
        .post('/graphql')
        .send(data);

      const res = await request(server)
        .post('/graphql')
        .send(data);

      expect(res.status).toEqual(200);
      expect(res.body).toEqual({
        data: {
          register: {
            errors: [
              {
                field: 'email',
                message: 'email already exist',
              },
            ],
            user: null,
          },
        },
      });
      const dbUser = await User.findOne({ where: { email: testUser.email } });
      expect(dbUser).toBeDefined();
    });

    it('bad input: email input is not an email', async () => {
      const testUser = {
        email: 'invalidemail',
        name: 'Register 3',
        password: '123456789',
      };

      const data = {
        query: registerMutation({
          email: testUser.email,
          name: testUser.name,
          password: testUser.password,
        }),
      };

      const res = await request(server)
        .post('/graphql')
        .send(data);

      expect(res.status).toEqual(200);
      expect(res.body.errors.length).toEqual(1);
      expect(res.body.errors[0].message).toEqual('"email" must be a valid email');
      const dbUser = await User.findOne({ where: { email: testUser.email } });
      expect(dbUser).toEqual(undefined);
    });

    it('bad input: password is too short', async () => {
      const testUser = {
        email: 'register4@email.com',
        name: 'Register 4',
        password: '12',
      };

      const data = {
        query: registerMutation({
          email: testUser.email,
          name: testUser.name,
          password: testUser.password,
        }),
      };

      const res = await request(server)
        .post('/graphql')
        .send(data);

      expect(res.status).toEqual(200);
      expect(res.body.errors.length).toEqual(1);
      expect(res.body.errors[0].message).toEqual('"password" length must be at least 8 characters long');
      const dbUser = await User.findOne({ where: { email: testUser.email } });
      expect(dbUser).toEqual(undefined);
    });

    it('bad input: password is too long', async () => {
      const testUser = {
        email: 'register5@email.com',
        name: 'Register 5',
        password: 'bfcqfvfimgohnknnekemkdzvijhlgnjustldxigdcizgmsfmtfbczwhsqrtcowzajonyumbhwkgktihewotllnungbgkuyaqhgmau',
      };

      const data = {
        query: registerMutation({
          email: testUser.email,
          name: testUser.name,
          password: testUser.password,
        }),
      };

      const res = await request(server)
        .post('/graphql')
        .send(data);

      expect(res.status).toEqual(200);
      expect(res.body.errors.length).toEqual(1);
      expect(res.body.errors[0].message).toEqual('"password" length must be less than or equal to 100 characters long');
      const dbUser = await User.findOne({ where: { email: testUser.email } });
      expect(dbUser).toEqual(undefined);
    });
  });

  describe('Login mutation', () => {
    it('valid request', async () => {
      const testUser = {
        email: 'login1@email.com',
        name: 'Login 1',
        password: '12345678',
      };

      const registerData = {
        query: registerMutation({
          email: testUser.email,
          name: testUser.name,
          password: testUser.password,
        }),
      };

      const registerRes = await request(server)
        .post('/graphql')
        .send(registerData);

      const data = {
        query: loginMutation({
          email: testUser.email,
          password: testUser.password,
        }),
      };

      const res = await request(server)
        .post('/graphql')
        .send(data);

      expect(res.status).toEqual(200);
      expect(res.body).toEqual({
        data: {
          login: {
            errors: null,
            user: registerRes.body.data.register.user,
          },
        },
      });
      const cookie = extractCookies(res.headers);
      expect(cookie).toBeDefined();
    });

    it("email doesn't exist", async () => {
      const testUser = {
        email: 'login2@email.com',
        name: 'Login 2',
        password: '12345678',
      };

      const data = {
        query: loginMutation({
          email: testUser.email,
          password: testUser.password,
        }),
      };

      const res = await request(server)
        .post('/graphql')
        .send(data);

      expect(res.status).toEqual(200);
      expect(res.body).toEqual({
        data: {
          login: {
            errors: [
              {
                field: 'email',
                message: "that email doesn't exist",
              },
            ],
            user: null,
          },
        },
      });
    });

    it('incorrect password', async () => {
      const testUser = {
        email: 'login3@email.com',
        name: 'Login 3',
        password: '12345678',
      };
      const incorrectPassword = 'incorrectPassword';

      const registerData = {
        query: registerMutation({
          email: testUser.email,
          name: testUser.name,
          password: testUser.password,
        }),
      };

      await request(server)
        .post('/graphql')
        .send(registerData);

      const data = {
        query: loginMutation({
          email: testUser.email,
          password: incorrectPassword,
        }),
      };

      const res = await request(server)
        .post('/graphql')
        .send(data);

      expect(res.status).toEqual(200);
      expect(res.body).toEqual({
        data: {
          login: {
            errors: [
              {
                field: 'password',
                message: 'incorrect password',
              },
            ],
            user: null,
          },
        },
      });
    });
  });

  describe('Me query', () => {
    it('valid request', async () => {
      const testUser = {
        email: 'me1@email.com',
        name: 'Me 1',
        password: '12345678',
      };

      const registerData = {
        query: registerMutation({
          email: testUser.email,
          name: testUser.name,
          password: testUser.password,
        }),
      };

      const registerRes = await request(server)
        .post('/graphql')
        .send(registerData);

      const loginData = {
        query: loginMutation({
          email: testUser.email,
          password: testUser.password,
        }),
      };

      const loginRes = await request(server)
        .post('/graphql')
        .send(loginData);

      const cookie = extractCookies(loginRes.headers);
      const cookieString = `${Object.keys(cookie)[0]}=${cookie[Object.keys(cookie)[0]].value}`;

      const data = {
        query: meQuery(),
      };

      const res = await request(server)
        .post('/graphql')
        .set('Cookie', [cookieString])
        .send(data);

      expect(res.status).toEqual(200);
      expect(res.body).toEqual({
        data: {
          me: registerRes.body.data.register.user,
        },
      });
    });

    it('not logged in', async () => {
      const testUser = {
        email: 'me1@email.com',
        name: 'Me 1',
        password: '12345678',
      };

      const registerData = {
        query: registerMutation({
          email: testUser.email,
          name: testUser.name,
          password: testUser.password,
        }),
      };

      await request(server)
        .post('/graphql')
        .send(registerData);

      const data = {
        query: meQuery(),
      };

      const res = await request(server)
        .post('/graphql')
        .send(data);

      expect(res.status).toEqual(200);
      expect(res.body).toEqual({
        data: {
          me: null,
        },
      });
    });
  });

  describe('Forgot Password mutation', () => {
    it('valid request', async () => {
      const testUser = {
        email: 'forgotPassword1@email.com',
        name: 'Forgot Password 1',
        password: '12345678',
      };

      const data = {
        query: forgotPasswordMutation({
          email: testUser.email,
        }),
      };

      const res = await request(server)
        .post('/graphql')
        .send(data);

      expect(res.status).toEqual(200);
      expect(res.body).toEqual({
        data: {
          forgotPassword: true,
        },
      });
    });
  });
});
