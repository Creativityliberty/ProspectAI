
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
  images: string[];
  textBlocks: { origin: string; text: string }[];
  links: string[];
  notes: string;
}

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

// --- WORKSPACE (P0) ---
export type WorkspaceStatus = 'INTAKE_RECEIVED' | 'RUNNING' | 'NEEDS_INPUT' | 'NORMALIZED' | 'DONE' | 'FAILED';

export type ArtifactType = 'audit_system' | 'offer_system' | 'outreach_system' | 'crm_system' | 'seo_master' | 'site_spec' | 'sitemap_ascii' | 'other';

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: any;
  agent?: FactoryAgentName;
  version: number;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceValidation {
  hasContact: boolean;
  localSignals: boolean;
  ctaTopBottom: boolean;
  noBannedWords: boolean;
}

export interface WorkspaceVersion {
  id: string;
  note: string;
  createdAt: number;
  snapshot: any;
}

// --- SCOUTING (P3) ---
export interface ScoutLead {
  id: string;
  name: string;
  category?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  website?: string | null;
  mapsUrl?: string | null;
  source: 'paste' | 'csv' | 'manual' | 'api';
  notes?: string;
  createdAt: number;
  score?: number;
  tags?: string[];
}

export interface ScoutQuery {
  query: string;
  city: string;
  radiusKm?: number;
}

// --- P4: CRM ---
export type CRMStage = 'NEW' | 'CONTACTED' | 'REPLIED' | 'MEETING_BOOKED' | 'PROPOSAL_SENT' | 'WON' | 'LOST';

export interface CRMActivity {
  id: string;
  type: 'email' | 'dm' | 'call' | 'note' | 'meeting' | 'autopilot_event';
  content: string;
  createdAt: number;
}

export interface CRMFollowUp {
  id: string;
  dueAt: number;
  note?: string;
  done: boolean;
}

export interface CRMData {
  stage: CRMStage;
  activities: CRMActivity[];
  followUps: CRMFollowUp[];
  lastContactAt?: number;
}

// --- P5: AUTOPILOT ---
export type AutopilotStatus = 'OFF' | 'ACTIVE' | 'PAUSED' | 'STOPPED';

export interface AutopilotStep {
  id: string;
  delayDays: number;
  channel: 'email' | 'dm' | 'whatsapp';
  templateKey: string;
  sentAt?: number;
}

export interface AutopilotData {
  status: AutopilotStatus;
  steps: AutopilotStep[];
  nextRunAt?: number;
  currentStepIndex: number;
}

// --- P6: OUTBOX & MESSAGING ---
export type Channel = 'email' | 'whatsapp' | 'dm';
export type SendStatus = 'DRAFT' | 'QUEUED' | 'SENT' | 'FAILED' | 'CANCELLED';

export interface OutboxMessage {
  id: string;
  prospectId: string;
  channel: Channel;
  to: {
    email?: string;
    phoneE164?: string;
    handle?: string;
  };
  subject?: string;
  body: string;
  createdAt: number;
  scheduledAt?: number;
  sentAt?: number;
  status: SendStatus;
  error?: string;
  meta?: {
    templateKey?: string;
    stepId?: string;
    threadToken?: string; // P8: Token for matching replies
  };
  // P7: Tracking Stats
  tracking?: {
    opens: number;
    clicks: number;
    lastEventAt?: number;
  };
}

export interface SendLog {
  id: string;
  messageId: string;
  prospectId: string;
  channel: Channel;
  status: 'OK' | 'ERROR';
  provider?: string;
  providerMessageId?: string;
  at: number;
  detail?: any;
}

// --- P8: INBOUND & REPLY HANDLER ---
export type ReplyIntent =
  | 'positive'
  | 'question'
  | 'objection'
  | 'not_now'
  | 'unsubscribe'
  | 'wrong_person'
  | 'bounce'
  | 'out_of_office'
  | 'unknown';

export interface InboundMessage {
  id: string;
  prospectId?: string;         // si on match
  channel: 'email';            // P8 = email inbound
  from: string;
  to: string;
  subject?: string;
  text: string;
  receivedAt: number;
  raw?: any;
  matchedBy?: 'messageId' | 'email' | 'subjectToken' | 'manual';
}

export interface ReplyClassification {
  intent: ReplyIntent;
  confidence: number;          // 0..1
  summary: string;             // 1-2 lignes
  suggestedNextAction: 'stop_autopilot' | 'schedule_followup' | 'reply' | 'ignore';
  proposedReply?: {
    subject?: string;
    body: string;
  };
}

// --- MODULE DEFINITIONS ---
export interface AuditSystem {
  checks: string[];
  output: { score: number; quick_wins: string[]; priority: 'P1' | 'P2' | 'P3' };
}
export interface OfferTier { name: string; price?: string; goal: string; includes: string[] }
export interface OfferSystem { tiers: OfferTier[] }
export interface OutreachSystem {
  persona: { type: string; tone: string; pain_points: string[] };
  sequences: { email: any; messenger: any; whatsapp: any };
  call_script: { intro: string; hook: string; goal: string };
  objections: { objection: string; response: string }[];
}
export interface CrmSystem { statuses: string[]; auto_actions: Record<string, string> }
export interface LocalSeoSystem { page_types: string[]; must_have_blocks: string[]; schema: any }
export interface ContentBlocksSystem { library: string[] }
export interface SeoPageMaster { id: string; slug: string; priority: string; title: string; meta: string; h1: string; faq: any[]; jsonld: any; internal_links: string[] }
export interface SeoMasterFile { site: any; pages: SeoPageMaster[] }
export interface SitePage { path: string; seo: any; contentStructure: string[]; previewHtml?: string }
export interface SiteArchitecture {
  spec?: any;
  seoSystem?: LocalSeoSystem;
  blocksSystem?: ContentBlocksSystem;
  seoMasterFile?: SeoMasterFile;
  sitemapAscii: string;
  pages: SitePage[];
  exports: any;
  designSystem: any;
}

// --- PROSPECT ---
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
  status?: 'cold' | 'warm' | 'hot';
  crmStatus?: string; // Legacy field, prefer crm.stage
  
  opportunity?: string;
  businessActivity?: string;
  keySellingPoints?: string[];
  suggestedPitch?: string;

  factoryState?: Record<FactoryAgentName, AgentRunState>;
  audit?: AuditSystem;
  offers?: OfferSystem;
  outreach?: OutreachSystem;
  crmLogic?: CrmSystem;
  emails?: any[];
  painPoints?: any;
  prototype?: SiteArchitecture;

  workspaceStatus?: WorkspaceStatus;
  currentAgent?: FactoryAgentName | '';
  warnings?: string[];
  errors?: string[];
  artifacts?: Artifact[];
  versions?: WorkspaceVersion[];
  validation?: WorkspaceValidation;
  
  // P4: CRM
  crm?: CRMData;

  // P5: Autopilot
  autopilot?: AutopilotData;

  // P6: Messaging
  outbox?: OutboxMessage[];
  sendLogs?: SendLog[];
  optOut?: { email?: boolean; whatsapp?: boolean; dm?: boolean };
  contact?: { email?: string; phone_e164?: string }; // Verified contact info

  // P8: Inbound
  inbound?: InboundMessage[];
  replyClassifications?: Record<string, ReplyClassification>; // key=inboundId

  createdAt?: number;
}
