
import crypto from "crypto";

/**
 * IMPORTANT:
 * - Tu dois valider la signature du provider (ici: placeholder)
 * - Ensuite tu transforms en format commun.
 */

const uid = (pfx) => `${pfx}_${crypto.randomBytes(6).toString("hex")}_${Date.now()}`;

export function inboundEmailRoute(app) {
  app.post("/inbound/email", async (req, res) => {
    // TODO: validate signature from provider (SendGrid/Mailgun/Resend)
    const payload = req.body;

    // Normalisation minimaliste: adapte selon provider
    const from = payload.from || payload.sender || payload.envelope?.from || "";
    const to = payload.to || payload.recipient || payload.envelope?.to || "";
    const subject = payload.subject || "";
    const text = payload.text || payload["stripped-text"] || payload["body-plain"] || "";

    const inbound = {
      id: uid("inb"),
      channel: "email",
      from,
      to,
      subject,
      text,
      receivedAt: Date.now(),
      raw: payload,
    };

    // Ici, tu peux:
    // - matcher prospectId (via token + messageId)
    // - appeler un classify endpoint (Gemini/OpenAI) si tu veux
    // Pour P8: on répond juste OK et on stocke (à toi: DB / fichier / redis)
    console.log("INBOUND_EMAIL", inbound);

    return res.json({ ok: true, inboundId: inbound.id });
  });
}
