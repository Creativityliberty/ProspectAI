
import { Prospect, IntakeData, ScoutLead } from '../types';

const now = () => Date.now();

export const leadToProspect = (lead: ScoutLead): Prospect => {
  const intake: IntakeData = {
    prospectName: lead.name,
    city: lead.city ?? '',
    category: lead.category ?? '',
    mode: 'mix',
    images: [],
    links: [
      ...(lead.mapsUrl ? [lead.mapsUrl] : []),
      ...(lead.website ? [lead.website] : []),
    ],
    textBlocks: [
      {
        origin: lead.source,
        text: [
          `Nom: ${lead.name}`,
          lead.phone ? `Tel: ${lead.phone}` : '',
          lead.email ? `Email: ${lead.email}` : '',
          lead.address ? `Adresse: ${lead.address}` : '',
          lead.website ? `Site: ${lead.website}` : 'Site: (absent)',
          `Tags: ${(lead.tags || []).join(', ')}`
        ].filter(Boolean).join('\n'),
      },
    ],
    notes: lead.notes ?? '',
  };

  return {
    id: `p_${lead.id}`,
    name: lead.name,
    address: lead.address || lead.city || '',
    hasWebsite: !!lead.website,
    businessActivity: lead.category || 'Unknown',
    phone: lead.phone,
    websiteUri: lead.website || undefined,
    createdAt: now(),
    
    // Enriched fields based on scoring
    status: (lead.score || 0) > 40 ? 'hot' : (lead.score || 0) > 20 ? 'warm' : 'cold',
    crmStatus: 'To Contact',
    
    intake,
    
    // Champs P0/P1
    workspaceStatus: 'INTAKE_RECEIVED',
    currentAgent: '',
    warnings: [],
    errors: [],
    artifacts: [],
    versions: [],
    validation: { hasContact: !!lead.phone, localSignals: !!lead.address, ctaTopBottom: false, noBannedWords: true },
    factoryState: {
      Collector: { status: 'waiting' },
      Normalizer: { status: 'waiting' },
      PainFinder: { status: 'waiting' },
      OfferBuilder: { status: 'waiting' },
      Copywriter: { status: 'waiting' },
      PrototypeDesigner: { status: 'waiting' },
    },
  };
};

export const mergeProspects = (existing: Prospect[], incoming: Prospect[]) => {
  const map = new Map(existing.map((p) => [p.id, p]));
  for (const p of incoming) {
    if (!map.has(p.id)) map.set(p.id, p);
  }
  return Array.from(map.values());
};
