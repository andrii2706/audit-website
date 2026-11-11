import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ADMIN_LABELS } from '../src/seed/admin-labels';

const root = join(__dirname, '..', 'src');
const schemas = [
  ...readdirSync(join(root, 'api')).flatMap((api) => {
    const dir = join(root, 'api', api, 'content-types');
    try { return readdirSync(dir).map((t) => join(dir, t, 'schema.json')); } catch { return []; }
  }),
  ...readdirSync(join(root, 'components')).flatMap((cat) => readdirSync(join(root, 'components', cat)).map((f) => join(root, 'components', cat, f))),
];

describe('admin labels', () => {
  it('every field of every content type and component has a Ukrainian label', () => {
    const missing = schemas.flatMap((f) => Object.keys(JSON.parse(readFileSync(f, 'utf8')).attributes ?? {}).filter((a) => !ADMIN_LABELS[a]).map((a) => `${f.split('src/')[1]}: ${a}`));
    expect(missing).toEqual([]);
  });
  it('help texts are short enough to read under a field', () => {
    for (const v of Object.values(ADMIN_LABELS)) if (Array.isArray(v)) expect(v[1].length).toBeLessThanOrEqual(180);
  });
});
