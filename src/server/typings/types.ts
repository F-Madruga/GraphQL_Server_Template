import { Request, Response } from 'express';
import { Redis } from 'ioredis';
import {
  ObjectType,
  Field,
} from 'type-graphql';

export type Context = {
  req: Request & { session: any };
  redis: Redis;
  res: Response;
};

@ObjectType()
export class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
export class BaseResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}
