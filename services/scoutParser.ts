
import { ScoutLead } from '../types';

const now = () => Date.now();

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `h_${Math.abs(h)}`;
};

const clean = (s: string) => (s || '').trim();

const extractPhone = (line: string) => {
  // FR: très permissif, on normalize après
  const m = line.match(/(\+33|0)\s?[1-9](?:[\s.\-]?\d{2}){4}/);
  return m ? m[0].replace(/[^\d+]/g, '') : '';
};

const extractUrl = (line: string) => {
  const m = line.match(/https?:\/\/[^\s]+/i);
  return m ? m[0] : '';
};

const extractEmail = (line: string) => {
  const m = line.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return m ? m[0] : '';
};

/**
 * Format toléré (ligne par ligne), exemples :
 * - "Nom | Adresse | CP Ville | Tel | site"
 * - "Nom - Tel - Ville"
 * - exports CSV collés (séparateur ; ou ,)
 * - Google Maps copié-collé : on fait best-effort
 */
export const parseLeadsFromText = (text: string): ScoutLead[] => {
  const raw = (text || '').split('\n').map(clean).filter(Boolean);
  const leads: ScoutLead[] = [];

  for (const row of raw) {
    // split par ; , | ou tab
    const parts = row.split(/[;|\t]/).map(clean).filter(Boolean);

    const nameGuess = parts[0] ?? row.split('-')[0]?.trim() ?? row;
    const phone = extractPhone(row) || extractPhone(parts.slice(1).join(' '));
    const email = extractEmail(row);
    const url = extractUrl(row);

    // heuristique adresse : si on a 2+ champs, concat sauf tel/url/email
    const addressParts = parts
      .slice(1)
      .filter((p) => !p.includes('http') && !p.includes('@') && !extractPhone(p));
    const address = addressParts.join(', ');

    const id = hash(`${nameGuess.toLowerCase()}|${(phone || '').toLowerCase()}|${(address || '').toLowerCase()}`);

    leads.push({
      id,
      name: clean(nameGuess),
      phone: phone || undefined,
      email: email || undefined,
      address: address || undefined,
      website: url || null,
      mapsUrl: null,
      source: url ? 'paste' : 'paste',
      createdAt: now(),
      tags: [],
    });
  }

  // dedupe par id simple avant processing plus complexe
  const seen = new Set<string>();
  return leads.filter((l) => (seen.has(l.id) ? false : (seen.add(l.id), true)));
};
