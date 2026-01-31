
import { ScoutLead } from '../types';

export function tagLead(l: ScoutLead): string[] {
  const tags: string[] = [];

  if (!l.website) tags.push('no_website');
  if (l.phone) tags.push('has_phone');
  if (l.email) tags.push('has_email');
  if (l.address) tags.push('has_address');

  if (l.city) tags.push(`city:${l.city.toLowerCase()}`);
  if (l.category) tags.push(`cat:${l.category.toLowerCase()}`);

  return tags;
}
