declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: string;
    LOG_LEVEL: string;
    DATABASE_URL: string;
    REDIS_URL: string;
    SERVER_PORT: string;
    COOKIE_NAME: string;
    FORGET_PASSWORD_PREFIX: string;
    SESSION_SECRET: string;
  }
}
