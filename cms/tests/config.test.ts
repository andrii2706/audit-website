import { describe, expect, it } from 'vitest';
import middlewares from '../config/middlewares';
import admin from '../config/admin';

/** Minimal stand-in for Strapi's `env` helper. */
const makeEnv = (vars: Record<string, string>) => {
  const env = ((k: string, d?: unknown) => vars[k] ?? d) as any;
  env.array = (k: string, d?: unknown) => (vars[k] ? vars[k].split(',') : d);
  env.bool = (k: string, d?: boolean) => (k in vars ? vars[k] === 'true' : d);
  env.int = (k: string, d?: number) => (k in vars ? Number(vars[k]) : d);
  return env;
};
const find = (list: any[], name: string) => list.find((m) => (typeof m === 'string' ? m : m.name) === name);

describe('CMS middlewares', () => {
  const prod = middlewares({ env: makeEnv({ PUBLIC_URL: 'https://cms.bp-audit.com.ua', SITE_URL: 'https://bp-audit.com.ua' }) } as any) as any[];
  const local = middlewares({ env: makeEnv({}) } as any) as any[];

  it('does not advertise "X-Powered-By: Strapi"', () => expect(find(prod, 'strapi::poweredBy')).toBeUndefined());
  it('allows CORS only from the site and the CMS in production', () => {
    expect(find(prod, 'strapi::cors').config.origin).toEqual(['https://cms.bp-audit.com.ua', 'https://bp-audit.com.ua']);
    expect(find(local, 'strapi::cors').config.origin).toEqual(['*']);
  });
  it('turns HSTS on only behind https', () => {
    expect(find(prod, 'strapi::security').config.hsts).toMatchObject({ maxAge: 31536000 });
    expect(find(local, 'strapi::security').config.hsts).toBe(false);
  });
  it('limits request bodies', () => {
    expect(find(prod, 'strapi::body').config).toMatchObject({ jsonLimit: '1mb', formidable: { maxFileSize: 50 * 1024 * 1024 } });
  });
});

describe('admin config', () => {
  it('rate-limits the admin login', () => {
    const cfg = admin({ env: makeEnv({ ADMIN_JWT_SECRET: 'x', API_TOKEN_SALT: 'x', TRANSFER_TOKEN_SALT: 'x', ENCRYPTION_KEY: 'x' }) } as any) as any;
    expect(cfg.rateLimit).toMatchObject({ enabled: true, max: 5 });
  });
});
