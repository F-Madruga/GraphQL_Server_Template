import {
  ObjectType,
  InputType,
  Field,
} from 'type-graphql';
import * as jf from 'joiful';
import { BaseResponse } from '../typings/types';
import { User } from '../entities/User';

@ObjectType()
export class UserResponse extends BaseResponse {
  @Field(() => User, { nullable: true })
  user?: User;
}

@InputType()
export class LoginInput {
  @Field()
  @jf.string().email().lowercase().required()
  email: string;

  @Field()
  @jf.string().min(8).max(100).required()
  password: string;
}

@InputType()
export class RegisterInput {
  @Field()
  @jf.string().email().lowercase().required()
  email: string;

  @Field()
  @jf.string().required()
  name: string;

  @Field()
  @jf.string().min(8).max(100).required()
  password: string;
}

@InputType()
export class ForgotPasswordInput {
  @Field()
  @jf.string().email().lowercase().required()
  email: string;
}

@InputType()
export class ChangePasswordInput {
  @Field()
  @jf.string().required()
  token: string;

  @Field()
  @jf.string().min(8).max(100).required()
  newPassword: string;
}
