
import { Prospect, WorkspaceValidation } from '../types';

// ⚠️ Liste simple (tu pourras la brancher sur ton spec plus tard)
export const BANNED_WORDS = [
  'garanti',
  'révolutionnaire',
  'meilleur',
  'exceptionnel',
  'incroyable',
  'promo',
  'offre de folie',
  'prix imbattables',
];

const normalize = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, ''); // enlève accents

const deepStringify = (obj: any): string => {
  try {
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    return JSON.stringify(obj);
  } catch {
    return String(obj ?? '');
  }
};

export const scanBannedWords = (text: string) => {
  const t = normalize(text);
  const hits: string[] = [];
  for (const w of BANNED_WORDS) {
    if (t.includes(normalize(w))) hits.push(w);
  }
  return hits;
};

export const computeValidation = (p: Prospect): { validation: WorkspaceValidation; warnings: string[] } => {
  const warnings: string[] = [];

  // Adapt accessors to the actual Prospect type and Factory Outputs

  // 1) Contact OK
  // Check root fields or extracted fields from Normalizer/Collector
  const phone = 
    p.phone || 
    p.factoryState?.Normalizer?.output?.phone || 
    p.factoryState?.Collector?.output?.phone || 
    '';
    
  const email = 
    p.factoryState?.Normalizer?.output?.email || 
    p.factoryState?.Collector?.output?.email || 
    '';

  const hasContact = Boolean((phone && phone.trim()) || (email && email.trim()));
  if (!hasContact) warnings.push('Contact manquant (téléphone/email).');

  // 2) Local signals OK
  const city = p.intake?.city || p.factoryState?.Normalizer?.output?.city || '';
  const address = p.address || p.factoryState?.Normalizer?.output?.address || '';
  
  // Basic check for city and address as proxies for local signals
  const localSignals = Boolean(city && address);
  if (!localSignals) warnings.push('Signaux locaux incomplets (ville + adresse).');

  // 3) CTA top + bottom (Check Prototype output)
  const proto = p.factoryState?.PrototypeDesigner?.output?.prototype || null;
  const protoText = deepStringify(proto);
  
  // Check for presence of 'Hero' (top) and 'Contact' or 'CTA' (bottom) components in the spec/preview
  const ctaTopBottom =
    p.factoryState?.PrototypeDesigner?.status === 'done' 
    ? (normalize(protoText).includes('hero') && (normalize(protoText).includes('contact') || normalize(protoText).includes('cta')))
    : false;

  if (p.factoryState?.PrototypeDesigner?.status === 'done' && !ctaTopBottom) {
      warnings.push('CTA top/bottom non détecté (hero + cta/contact).');
  }

  // 4) No banned words (scan sur sorties clés)
  const blobs = [
    deepStringify(p.factoryState?.OfferBuilder?.output),
    deepStringify(p.factoryState?.Copywriter?.output),
    deepStringify(p.factoryState?.PrototypeDesigner?.output),
    deepStringify(p.outreach),
    deepStringify(p.emails),
  ].join('\n');

  const hits = scanBannedWords(blobs);
  const noBannedWords = hits.length === 0;
  if (!noBannedWords) warnings.push(`Mots interdits détectés: ${hits.join(', ')}`);

  const validation: WorkspaceValidation = {
    hasContact,
    localSignals,
    ctaTopBottom,
    noBannedWords,
  };

  return { validation, warnings };
};
