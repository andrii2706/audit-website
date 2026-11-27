import * as structure from './structure';
import * as legacy from './legacy';

export type ServiceEntry = { slug: string; cat: structure.CategoryKey; homeOrder?: number; steps?: boolean };

/** Services from the brief plus the old-site services, each inserted after the last one of its category. */
export function allServices(): ServiceEntry[] {
  const list: ServiceEntry[] = [...structure.services];
  for (const extra of legacy.newServices) {
    let at = -1;
    list.forEach((s, i) => { if (s.cat === extra.cat) at = i; });
    list.splice(at + 1, 0, extra);
  }
  return list;
}
