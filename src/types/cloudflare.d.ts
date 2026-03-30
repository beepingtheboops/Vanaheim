declare module '@cloudflare/next-on-pages' {
  export interface CloudflareEnv {
    TURNSTILE_SECRET_KEY: string;
    DB: D1Database;
    JWT_SECRET: string;
  }
  
  export function getRequestContext(): {
    env: CloudflareEnv;
    cf: IncomingRequestCfProperties;
    ctx: ExecutionContext;
  };
}