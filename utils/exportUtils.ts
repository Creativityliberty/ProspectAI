
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { Prospect } from '../types';

export const generateClientPack = async (prospect: Prospect) => {
  const zip = new JSZip();
  // Root folder: P-xxxx-name
  const safeName = prospect.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const folderName = `prospects/${prospect.id}_${safeName}`;
  const root = zip.folder(folderName);

  if (!root) return;

  // --- 1. INTAKE (Données brutes) ---
  const intakeFolder = root.folder("intake");
  if (intakeFolder && prospect.factoryState?.Collector?.output) {
    intakeFolder.file("intake_raw.json", JSON.stringify(prospect.factoryState.Collector.output, null, 2));
  }

  // --- 2. MODULES (Standardized Systems) ---
  const modulesFolder = root.folder("modules");
  if (modulesFolder) {
    // Module 1: Audit
    if (prospect.audit) {
        modulesFolder.file("audit_system.json", JSON.stringify(prospect.audit, null, 2));
    }
    // Module 2: Offers
    if (prospect.offers) {
        modulesFolder.file("offer_system.json", JSON.stringify(prospect.offers, null, 2));
    }
    // Module 3 & 5: Outreach & CRM
    if (prospect.outreach) {
        modulesFolder.file("outreach_system.json", JSON.stringify(prospect.outreach, null, 2));
    }
    if (prospect.crmLogic) {
        modulesFolder.file("crm_followup_system.json", JSON.stringify(prospect.crmLogic, null, 2));
    }
    // Module 4, 6, 7: Site Spec, SEO, Blocks, Master File
    if (prospect.prototype) {
        if (prospect.prototype.seoMasterFile) {
            modulesFolder.file("seo_pages_master.json", JSON.stringify(prospect.prototype.seoMasterFile, null, 2));
        }
        if (prospect.prototype.spec) {
            modulesFolder.file("site_spec_v1.json", JSON.stringify(prospect.prototype.spec, null, 2));
        }
        if (prospect.prototype.seoSystem) {
            modulesFolder.file("local_seo_system.json", JSON.stringify(prospect.prototype.seoSystem, null, 2));
        }
        if (prospect.prototype.blocksSystem) {
            modulesFolder.file("content_blocks_library.json", JSON.stringify(prospect.prototype.blocksSystem, null, 2));
        }
        if (prospect.prototype.sitemapAscii) {
            modulesFolder.file("sitemap_ascii.txt", prospect.prototype.sitemapAscii);
        }
    }
  }
  
  // --- 3. ARTIFACTS (P2: Clean Editable Files) ---
  const artifactsFolder = root.folder("artifacts");
  if (artifactsFolder && prospect.artifacts) {
    for (const a of prospect.artifacts) {
        const safeTitle = a.title.replace(/[^a-z0-9_-]+/gi, '_').slice(0, 60);
        const name = `${a.type}__${safeTitle}__v${a.version}.json`;
        artifactsFolder.file(name, JSON.stringify(a, null, 2));
    }
  }

  // --- 4. HUMAN READABLE OUTPUTS ---
  const outputsFolder = root.folder("readable_outputs");
  if (outputsFolder) {
    if (prospect.painPoints) {
      outputsFolder.file("diagnostic_summary.json", JSON.stringify(prospect.painPoints, null, 2));
    }
    if (prospect.emails) {
      outputsFolder.file("generated_emails.json", JSON.stringify(prospect.emails, null, 2));
    }
  }

  // --- 5. LOGS (Transparence) ---
  const logsFolder = root.folder("logs");
  if (logsFolder && prospect.factoryState) {
    Object.entries(prospect.factoryState).forEach(([agent, state]) => {
      if (state.logs) {
        logsFolder.file(`${agent.toLowerCase()}.json`, JSON.stringify(state.logs, null, 2));
      }
    });
  }

  // Generate ZIP
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${prospect.id}_LEADFACTORY_FULL_SYSTEM.zip`);
};
