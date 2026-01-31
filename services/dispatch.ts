
import { Prospect } from '../types';
import { addSendLog, ensureOutbox, listDueMessages, setMessageStatus } from './outbox';
import { sendEmail, sendWhatsApp, SENDER_BASE } from './senderClient';

export async function dispatchDueMessages(prospect: Prospect): Promise<Prospect> {
  let p = ensureOutbox(prospect);
  const due = listDueMessages(p);

  for (const m of due) {
    // opt-out safety
    if (m.channel === 'email' && p.optOut?.email) {
      p = setMessageStatus(p, m.id, 'CANCELLED', { error: 'Opt-out email' });
      continue;
    }
    if (m.channel === 'whatsapp' && p.optOut?.whatsapp) {
      p = setMessageStatus(p, m.id, 'CANCELLED', { error: 'Opt-out whatsapp' });
      continue;
    }

    try {
      if (m.channel === 'email') {
        
        // --- P7: TRACKING INJECTION ---
        const trackingId = m.id;
        
        // 1. Unsubscribe Link
        const unsubUrl = `${SENDER_BASE}/unsubscribe/${p.id}/email`;
        const footer = `<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #888;">
          <p>Vous recevez cet email car nous avons identifié des opportunités pour ${p.name}.</p>
          <p><a href="${unsubUrl}" style="color: #888;">Se désinscrire</a></p>
        </div>`;

        // 2. Rewrite Links (Simple regex to capture http/https urls)
        let htmlContent = m.body.replace(/\n/g, '<br/>'); // Basic text-to-html
        
        htmlContent = htmlContent.replace(
            /(https?:\/\/[^\s<"']+)/g, 
            (url) => `${SENDER_BASE}/t/click/${trackingId}?url=${encodeURIComponent(url)}`
        );

        // 3. Open Pixel
        const pixel = `<img src="${SENDER_BASE}/t/open/${trackingId}" width="1" height="1" alt="" style="display:none;" />`;
        
        // --- P8: SUBJECT TOKEN INJECTION ---
        // Strategy: We append it to the subject for reliable threading, but we can also hide it in the body for backup.
        let finalSubject = m.subject || '(no subject)';
        if (m.meta?.threadToken) {
            finalSubject += ` [LF:${m.meta.threadToken}]`;
        }
        
        // Optional: Add hidden span in body for parsing if subject gets cleaned by some clients
        const hiddenToken = m.meta?.threadToken 
            ? `<span style="display:none; color:transparent; font-size:0;">ref:${m.meta.threadToken}</span>` 
            : '';

        const finalHtml = `<div style="font-family: sans-serif; color: #333;">${htmlContent}</div>${footer}${pixel}${hiddenToken}`;

        // Send with HTML & Token
        const resp = await sendEmail({ 
            to: m.to.email!, 
            subject: finalSubject, 
            body: m.body, // Keep plain text for fallback
            html: finalHtml 
        });

        p = setMessageStatus(p, m.id, 'SENT', { 
            sentAt: Date.now(),
            // Initialize tracking stats
            tracking: { opens: 0, clicks: 0 } 
        });

        p = addSendLog(p, {
          messageId: m.id,
          prospectId: p.id,
          channel: 'email',
          status: 'OK',
          provider: resp.provider,
          providerMessageId: resp.providerMessageId,
          detail: resp,
        });

      } else if (m.channel === 'whatsapp') {
        // WhatsApp doesn't support HTML/Pixels easy. 
        // We can only track links if we shorten them, but WA is strict on links.
        // Sending plain body.
        
        const resp = await sendWhatsApp({ toE164: m.to.phoneE164!, body: m.body });
        p = setMessageStatus(p, m.id, 'SENT', { sentAt: Date.now() });
        p = addSendLog(p, {
          messageId: m.id,
          prospectId: p.id,
          channel: 'whatsapp',
          status: 'OK',
          provider: resp.provider,
          providerMessageId: resp.providerMessageId,
          detail: resp,
        });
      } else {
        p = setMessageStatus(p, m.id, 'FAILED', { error: 'DM provider not implemented' });
      }
    } catch (e: any) {
      p = setMessageStatus(p, m.id, 'FAILED', { error: String(e?.message || e) });
      p = addSendLog(p, {
        messageId: m.id,
        prospectId: p.id,
        channel: m.channel,
        status: 'ERROR',
        provider: 'unknown',
        detail: String(e?.message || e),
      });
    }
  }

  return p;
}
