
import { GoogleGenAI } from "@google/genai";
import { Prospect, FactoryAgentName } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const parseJSON = (text: string) => {
  try {
    let clean = text.replace(/```json/g, '').replace(/```/g, '');
    const firstOpen = clean.indexOf('{');
    const lastClose = clean.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1) {
      clean = clean.substring(firstOpen, lastClose + 1);
    }
    return JSON.parse(clean);
  } catch (e) {
    console.error("JSON Parse Error", e);
    return null;
  }
};

const sanitizeInput = (text: string) => {
  if (!text) return '';
  return text.replace(/[\uE000-\uF8FF]/g, ''); 
};

// --- LOGGING INSTRUCTION ---
const LOG_INSTRUCTION = `
IMPORTANT: Inclure un objet "_logs" dans la réponse JSON.
Format: { ...données..., "_logs": { "plan": ["Etape 1", "Etape 2"], "process": ["Action 1..."], "verification": [{ "check": "Validation X", "status": "OK" }] } }
`;

// --- AGENT PROMPTS ---

export const searchBusinesses = async (query: string): Promise<Prospect[]> => {
  return []; 
};

export const runAgent = async (agentName: FactoryAgentName, prospect: Prospect): Promise<Partial<Prospect>> => {
  const ai = getAI();
  
  // UPGRADE: Use gemini-3-flash-preview for ALL agents for maximum reliability and instruction following.
  const model = 'gemini-3-flash-preview';

  let prompt = "";
  
  // --- ACCUMULATE CONTEXT FROM PREVIOUS AGENTS ---
  const previousData = {
    collector: prospect.factoryState?.Collector?.output,
    normalizer: prospect.factoryState?.Normalizer?.output,
    painFinder: prospect.factoryState?.PainFinder?.output,
    offerBuilder: prospect.factoryState?.OfferBuilder?.output,
    copywriter: prospect.factoryState?.Copywriter?.output,
  };

  switch (agentName) {
    // ---------------------------------------------------------
    // 1. COLLECTOR: RAW EXTRACTION
    // ---------------------------------------------------------
    case 'Collector':
      const intake = prospect.intake;
      const rawText = intake?.textBlocks.map(t => t.text).join('\n\n') || '';
      
      prompt = `
        AGENT: Collector
        TASK: Extraire les entités structurées depuis le vrac.
        
        INPUTS BRUTS:
        ${sanitizeInput(rawText)}
        NOTES UTILISATEUR: ${sanitizeInput(intake?.notes || '')}
        HINTS: ${intake?.prospectName} / ${intake?.city}
        
        ${LOG_INSTRUCTION}
        
        OUTPUT JSON: { 
          "name": "Nom commercial", 
          "phone": "Tel brut", 
          "email": "Email brut", 
          "address": "Adresse complète", 
          "websiteUri": "URL", 
          "businessActivity": "Activité principale", 
          "keySellingPoints": ["Point fort 1", "Point fort 2"],
          "_logs": ... 
        }
      `;
      break;

    // ---------------------------------------------------------
    // 2. NORMALIZER: CLEANING
    // ---------------------------------------------------------
    case 'Normalizer':
      prompt = `
        AGENT: Normalizer
        TASK: Standardisation CRM.
        
        INPUT (Collector): ${JSON.stringify(previousData.collector)}
        
        RÈGLES:
        - Téléphone format E.164 (+33...)
        - Adresse propre (Rue, CP, Ville)
        - Nom propre (Pas de SARL, Caps Lock corrigé)
        
        ${LOG_INSTRUCTION}
        
        OUTPUT JSON: { 
          "name": "Nom Nettoyé", 
          "phone": "+336...", 
          "address": "123 Rue...", 
          "city": "Ville", 
          "postal_code": "Code",
          "businessActivity": "Activité", 
          "_logs": ... 
        }
      `;
      break;

    // ---------------------------------------------------------
    // 3. PAINFINDER: AUDIT SYSTEM MODULE
    // ---------------------------------------------------------
    case 'PainFinder':
      prompt = `
        AGENT: PainFinder (Module: Audit System)
        TASK: Générer l'audit et identifier les douleurs pour la vente.
        
        INPUT (Normalizer): ${JSON.stringify(previousData.normalizer)}
        CONTEXTE: Le client est un commerce local.
        
        1. Analyser: A-t-il un site ? Est-il visible ? A-t-il des avis ?
        2. Scorer: Donner une note sur 100.
        3. Prioriser: P1 (Urgent) / P2 / P3.
        
        ${LOG_INSTRUCTION}
        
        OUTPUT JSON:
        {
          "audit": {
            "checks": ["has_website", "has_reviews", "local_visibility"],
            "output": { "score": 45, "quick_wins": ["Créer Fiche GMB", "Site OnePage"], "priority": "P1" }
          },
          "painPoints": {
            "summary": "Résumé percutant du problème (ex: Invisible sur Google Maps).",
            "problems": ["Pas de site", "Pas d'avis"],
            "quickWins": ["...", "..."],
            "opportunities": [{ "title": "Capturer trafic local", "impact": "High" }]
          },
          "suggestedPitch": "Phrase d'accroche pour briser la glace.",
          "_logs": ...
        }
      `;
      break;

    // ---------------------------------------------------------
    // 4. OFFERBUILDER: OFFER SYSTEM MODULE
    // ---------------------------------------------------------
    case 'OfferBuilder':
      prompt = `
        AGENT: OfferBuilder (Module: Offer System)
        TASK: Construire les offres commerciales basées sur l'Audit.
        
        INPUT (Audit): ${JSON.stringify(previousData.painFinder)}
        INPUT (Profil): ${JSON.stringify(previousData.normalizer)}
        
        RÈGLE: Utiliser le "Offer System" template. 3 Tiers: Starter, Pro, Premium.
        Adapter les arguments aux "painPoints" identifiés précédemment.
        
        ${LOG_INSTRUCTION}
        
        OUTPUT JSON:
        {
          "offers": {
            "tiers": [
              { "name": "Starter", "goal": "Présence Minimum", "includes": ["Site OnePage", "Config WhatsApp"] },
              { "name": "Pro", "goal": "Acquisition", "includes": ["Site Multi-pages", "SEO Local", "Avis"] },
              { "name": "Premium", "goal": "Dominance", "includes": ["...", "..."] }
            ]
          },
          "_logs": ...
        }
      `;
      break;

    // ---------------------------------------------------------
    // 5. COPYWRITER: OUTREACH & CRM MODULES
    // ---------------------------------------------------------
    case 'Copywriter':
      prompt = `
        AGENT: Copywriter (Module: Outreach & CRM)
        TASK: Rédiger les scripts de vente et la logique CRM.
        
        INPUT (Offres): ${JSON.stringify(previousData.offerBuilder)}
        INPUT (Audit): ${JSON.stringify(previousData.painFinder)}
        INPUT (Profil): ${JSON.stringify(previousData.normalizer)}
        
        1. Utiliser les OFFRES pour justifier le contact.
        2. Utiliser l'AUDIT pour appuyer sur la douleur ("J'ai vu que vous n'aviez pas de site...").
        3. Générer le JSON "Outreach System".
        
        ${LOG_INSTRUCTION}
        
        OUTPUT JSON:
        {
          "outreach": {
            "persona": { "type": "Consultant Local", "tone": "Direct & Bienveillant", "pain_points": ["..."] },
            "sequences": {
              "email": { "day_0": "...", "day_3": "...", "day_7": "..." },
              "messenger": { "first_contact": "...", "follow_up": "..." },
              "whatsapp": { "first_contact": "...", "follow_up": "..." }
            },
            "call_script": { "intro": "...", "hook": "...", "goal": "Rendez-vous" },
            "objections": [{ "objection": "C'est trop cher", "response": "..." }]
          },
          "crmLogic": {
            "statuses": ["To Contact", "Contacted", "Negotiation", "Closed"],
            "auto_actions": { "no_reply_3_days": "Send Email 2" }
          },
          "emails": [ { "type": "Cold Email", "subject": "...", "body": "...", "channel": "Email" } ],
          "_logs": ...
        }
      `;
      break;

    // ---------------------------------------------------------
    // 6. PROTOTYPEDESIGNER: LEADSITE FRAMEWORK V1
    // ---------------------------------------------------------
    case 'PrototypeDesigner':
      prompt = `
        AGENT: PrototypeDesigner
        TASK: Générer le "LEADSITE FRAMEWORK™" complet (Architecture, SEO, Master File).
        
        INPUT (Tout le dossier): ${JSON.stringify(previousData)}
        
        ### LEADSITE FRAMEWORK™ - RÈGLES STRICTES
        
        1. **SITEMAP ASCII (Format Obligatoire)**
           Structure P1 (Conversion) / P2 (Preuve) / P3 (Info).
           Le maillage interne doit être explicite.
        
        2. **MASTER SEO FILE (seo_pages.json)**
           Tu dois générer un tableau JSON complet de toutes les pages.
           IDs Obligatoires: home_001, service_001, area_001, contact_001.
           Chaque page doit avoir: Intent, Cible, Promesse, H1 Unique, Meta Pack.
           
        3. **LANDING PREVIEW**
           Génère le HTML Single-File (Tailwind) pour la page 'home_001'.
           Doit inclure: Hero + CTA WhatsApp, Bénéfices, Preuves, FAQ.
        
        ${LOG_INSTRUCTION}
        
        OUTPUT JSON:
        {
          "prototype": {
            "sitemapAscii": "/\\n├─ /services (P1)\\n│   └─ ...",
            "seoMasterFile": {
               "site": { "business_name": "...", "city": "...", "radius_km": 15 },
               "pages": [
                 { 
                   "id": "home_001", "slug": "/", "priority": "P1", 
                   "title": "...", "meta": "...", "h1": "...", 
                   "internal_links": ["service_001", "contact_001"],
                   "faq": [{ "question": "...", "answer": "..." }],
                   "jsonld": { "@context": "https://schema.org", "@type": "LocalBusiness" ... }
                 },
                 { "id": "service_001", "slug": "/services/...", "priority": "P1", "title": "...", "meta": "...", "h1": "..." },
                 { "id": "contact_001", "slug": "/contact", "priority": "P1", "title": "...", "meta": "...", "h1": "..." }
               ]
            },
            "seoSystem": { "page_types": ["Service + Ville"], "must_have_blocks": ["Hero", "Map"] },
            "blocksSystem": { "library": ["HeroCTA", "ProofCards", "ServiceCards"] },
            "spec": { "project": { "name": "..." }, "landing_template": { ... } },
            "pages": [{ 
              "path": "/", 
              "seo": { "title": "...", "h1": "..." }, 
              "previewHtml": "<!DOCTYPE html><html...><!-- TAILWIND CODE HERE --></html>" 
            }],
            "exports": { "robotsTxt": "...", "llmsTxt": "..." }
          },
          "_logs": ...
        }
      `;
      break;
      
    default:
      return {};
  }

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" }
  });

  try {
    const result = parseJSON(response.text || '{}');
    if (!result) throw new Error("Empty JSON");
    return result;
  } catch (e) {
    console.error(`Agent ${agentName} failed`, e);
    throw new Error(`Agent ${agentName} failed to generate valid output`);
  }
};

export const analyzeLeads = async (prospects: Prospect[]) => prospects;
