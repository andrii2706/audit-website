import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Guards for the server configuration that setup.sh installs (scripts/server). */
const read = (p: string) => readFileSync(join(__dirname, '..', '..', 'scripts', 'server', p), 'utf8');
const site = read('nginx/site.conf.template');
const http = read('nginx/bp-audit-http.conf');
const setup = read('setup.sh');

const block = (marker: string) => {
  const start = site.indexOf(marker);
  return site.slice(start, site.indexOf('\n  }', start));
};

describe('nginx', () => {
  it('hides its version and answers floods with 429', () => {
    expect(http).toMatch(/^server_tokens off;/m);
    expect(http).toMatch(/^limit_req_status 429;/m);
    for (const zone of ['bp_admin_login', 'bp_site_get', 'bp_site_post']) expect(http).toContain(`zone=${zone}:`);
  });
  it('closes the CMS content API, the revalidation hook and dotfiles to the internet', () => {
    expect(block('location /api/')).toContain('return 403');
    expect(block('location = /api/revalidate')).toContain('deny all');
    expect(site.match(/location ~ \/\\\.\(\?!well-known\/\) \{ deny all; \}/g)).toHaveLength(2);
  });
  it('rate-limits pages, the lead form and the admin login', () => {
    const pages = block('  location / {\n{{STAGING_AUTH}}');
    expect(pages).toContain('zone=bp_site_get');
    expect(pages).toContain('zone=bp_site_post');
    expect(block('location = /admin/login')).toContain('zone=bp_admin_login');
  });
  it('stops other sites from embedding uploads and resized images (hotlinking)', () => {
    for (const marker of ['location /uploads/', 'location /_next/image']) {
      expect(block(marker), marker).toContain('valid_referers none blocked server_names');
      expect(block(marker), marker).toContain('if ($invalid_referer) { return 403; }');
    }
  });
  it('passes the real visitor IP to the apps (rate limits and bot blocking rely on it)', () => {
    expect(block('  location / {\n{{STAGING_AUTH}}')).toContain('proxy_set_header X-Real-IP $remote_addr;');
  });
  it('puts every staging location behind the password', () => {
    expect(setup).toContain('s|{{STAGING_AUTH}}|$auth|g');
  });
});

describe('setup.sh', () => {
  it('installs the security tooling and the watermark fonts', () => {
    for (const pkg of ['fail2ban', 'unattended-upgrades', 'ufw', 'fonts-dejavu-core']) expect(setup).toContain(pkg);
  });
});
