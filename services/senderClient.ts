
export const SENDER_BASE = (import.meta as any).env?.VITE_SENDER_BASE || 'http://localhost:8787';

export async function sendEmail(payload: { to: string; subject: string; body: string; html?: string }) {
  try {
    const r = await fetch(`${SENDER_BASE}/send/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok || !data.ok) throw new Error(data?.error ? JSON.stringify(data.error) : 'Email send failed');
    return data;
  } catch (e) {
      console.error("Sender Client Error", e);
      throw e;
  }
}

export async function sendWhatsApp(payload: { toE164: string; body: string }) {
  try {
    const r = await fetch(`${SENDER_BASE}/send/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok || !data.ok) throw new Error(data?.error ? JSON.stringify(data.error) : 'WhatsApp send failed');
    return data;
  } catch (e) {
      console.error("Sender Client Error", e);
      throw e;
  }
}
