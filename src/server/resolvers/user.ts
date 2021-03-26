import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
} from 'type-graphql';
import argon2 from 'argon2';
import { getConnection } from 'typeorm';
import { v4 } from 'uuid';
import { User } from '../entities/User';
import { Context } from '../typings/types';
import { sendEmail } from '../utils/sendEmail';
import {
  UserResponse,
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ChangePasswordInput,
} from '../validation/user';
import logger from '../utils/logger';

@Resolver(User)
export class UserResolver {
  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: Context) {
    if (!req.session.userId) {
      return null;
    }

    return User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: RegisterInput,
      @Ctx() { req }: Context,
  ): Promise<UserResponse> {
    const hashedPassword = await argon2.hash(options.password);
    let user;
    try {
      // User.create({}).save()
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          email: options.email,
          name: options.name,
          password: hashedPassword,
        })
        .returning('*')
        .execute();
      [user] = result.raw;
    } catch (err) {
      // || err.detail.includes("already exists")) {
      // duplicate username error
      if (err.code === '23505') {
        return {
          errors: [
            {
              field: 'email',
              message: 'email already exist',
            },
          ],
        };
      }
    }

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options') options: LoginInput,
      @Ctx() { req }: Context,
  ): Promise<UserResponse> {
    const user = await User.findOne({ where: { email: options.email } });

    if (!user) {
      return {
        errors: [
          {
            field: 'email',
            message: "that email doesn't exist",
          },
        ],
      };
    }

    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'incorrect password',
          },
        ],
      };
    }

    req.session.userId = user.id;

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: Context) {
    return new Promise((resolve) => req.session.destroy((err: any) => {
      res.clearCookie(process.env.COOKIE_NAME);
      if (err) {
        logger.debug(err);
        resolve(false);
        return;
      }

      resolve(true);
    }));
  }

  @Mutation(() => Boolean)
  async forgotPassword(
  @Arg('options') options: ForgotPasswordInput,
    @Ctx() { redis }: Context,
  ) {
    const user = await User.findOne({ where: { email: options.email } });

    if (!user) {
      // the email is not in the db
      logger.debug("email doesn't exists");
      return true;
    }

    const token = v4();

    await redis.set(
      process.env.FORGET_PASSWORD_PREFIX + token,
      user.id,
      'ex',
      1000 * 60 * 60 * 24 * 3,
    ); // 3 days

    await sendEmail(
      options.email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`,
    );

    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('options') options: ChangePasswordInput,
      @Ctx() { redis, req }: Context,
  ): Promise<UserResponse> {
    const key = process.env.FORGET_PASSWORD_PREFIX + options.token;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: 'token',
            message: 'token expired',
          },
        ],
      };
    }

    const userIdNum = parseInt(userId);
    const user = await User.findOne(userIdNum);

    if (!user) {
      return {
        errors: [
          {
            field: 'token',
            message: 'user no longer exists',
          },
        ],
      };
    }

    await User.update(
      { id: userIdNum },
      {
        password: await argon2.hash(options.newPassword),
      },
    );

    await redis.del(key);

    // log in user after change password
    req.session.userId = user.id;

    return { user };
  }
}
