
export enum AgentStatus {
  IDLE = 'idle',
  SCOUTING = 'scouting',
  ANALYZING = 'analyzing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export type FactoryAgentName = 
  | 'Collector' 
  | 'Normalizer' 
  | 'PainFinder' 
  | 'OfferBuilder' 
  | 'Copywriter' 
  | 'PrototypeDesigner';

export type IntakeMode = 'card' | 'links' | 'mix';

export interface IntakeData {
  mode: IntakeMode;
  prospectName: string;
  city: string;
  category: string;
  images: string[]; // Base64 strings
  textBlocks: { origin: string; text: string }[];
  links: string[];
  notes: string;
}

// Structure for Agent "Transparency"
export interface AgentLog {
  plan: string[];
  process: string[];
  verification: { check: string; status: 'OK' | 'WARNING' | 'FAIL' }[];
}

export interface AgentRunState {
  status: 'waiting' | 'running' | 'done' | 'error';
  output?: any;
  logs?: AgentLog;
  timestamp?: number;
}

// --- MODULE 1: AUDIT SYSTEM ---
export interface AuditSystem {
  checks: string[];
  output: {
    score: number; // 0-100
    quick_wins: string[];
    priority: 'P1' | 'P2' | 'P3';
  };
}

// --- MODULE 2: OFFER SYSTEM ---
export interface OfferTier {
  name: string;
  price?: string; // Optional for spec
  goal: string;
  includes: string[];
}
export interface OfferSystem {
  tiers: OfferTier[];
}

// --- MODULE 3 & 5: OUTREACH & CRM ---
export interface OutreachSystem {
  persona: { type: string; tone: string; pain_points: string[] };
  sequences: {
    email: { day_0: string; day_3: string; day_7: string };
    messenger: { first_contact: string; follow_up: string };
    whatsapp: { first_contact: string; follow_up: string };
  };
  call_script: { intro: string; hook: string; goal: string };
  objections: { objection: string; response: string }[];
}

export interface CrmSystem {
  statuses: string[];
  auto_actions: Record<string, string>;
}

// --- MODULE 4, 6, 7: PROTOTYPE & SEO ---
export interface LocalSeoSystem {
  page_types: string[];
  must_have_blocks: string[];
  schema: { localbusiness: boolean; faq: boolean };
}

export interface ContentBlocksSystem {
  library: string[];
}

// --- LEADSITE FRAMEWORK MASTER FILE ---
export interface SeoPageMaster {
  id: string;
  slug: string;
  priority: 'P1' | 'P2' | 'P3';
  title: string;
  meta: string;
  h1: string;
  faq: { question: string; answer: string }[];
  jsonld: any;
  internal_links: string[];
}

export interface SeoMasterFile {
  site: {
    business_name: string;
    city: string;
    phone: string;
    whatsapp: string;
    radius_km: number;
  };
  pages: SeoPageMaster[];
}

export interface SitePage {
  path: string;
  seo: {
    title: string;
    metaDescription: string;
    h1: string;
    intention: string;
  };
  contentStructure: string[];
  previewHtml?: string;
}

export interface SiteArchitecture {
  // New Specs
  spec?: any; // The Full Site Spec V1
  seoSystem?: LocalSeoSystem;
  blocksSystem?: ContentBlocksSystem;
  seoMasterFile?: SeoMasterFile; // THE MASTER JSON
  
  sitemapAscii: string;
  pages: SitePage[];
  exports: {
    robotsTxt: string;
    sitemapXml: string;
    llmsTxt: string;
  };
  designSystem: {
    palette: string[];
    typography: string;
  };
}

// ------------------------------------------------

export interface Prospect {
  id: string;
  name: string;
  address: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  mapsUri?: string;
  hasWebsite: boolean;
  phone?: string;
  
  intake?: IntakeData;

  // Enriched fields
  status?: 'cold' | 'warm' | 'hot';
  crmStatus?: 'To Contact' | 'Contacted' | 'Replied' | 'Negotiation' | 'Closed';
  opportunity?: string;
  businessActivity?: string;
  keySellingPoints?: string[];
  suggestedPitch?: string;

  // Factory State
  factoryState?: Record<FactoryAgentName, AgentRunState>;
  
  // MODULE DATA CONTAINERS (Populated by Agents)
  audit?: AuditSystem;
  offers?: OfferSystem;
  outreach?: OutreachSystem;
  crmLogic?: CrmSystem;
  emails?: any[];
  
  // Legacy fields mapped to new systems for UI compatibility
  painPoints?: { summary: string; problems: string[]; quickWins: string[]; opportunities: any[] };
  
  // The Full Prototype Vision
  prototype?: SiteArchitecture;
}

export interface ProspectingSession {
  id: string;
  query: string;
  timestamp: number;
  prospects: Prospect[];
}
