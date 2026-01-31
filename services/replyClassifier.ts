
import { ReplyClassification } from '../types';

export async function classifyReply(input: {
  subject: string;
  text: string;
  context?: { businessName?: string; lastMessage?: string };
}): Promise<ReplyClassification> {
  // P8 baseline (sans appeler LLM): heuristiques
  const t = (input.text || '').toLowerCase();

  const has = (...words: string[]) => words.some((w) => t.includes(w));

  if (has('désinscrire', 'unsubscribe', 'stop', 'retirer')) {
    return {
      intent: 'unsubscribe',
      confidence: 0.9,
      summary: 'Demande de désinscription.',
      suggestedNextAction: 'stop_autopilot',
      proposedReply: { body: 'Bien reçu. Vous êtes désinscrit, bonne journée.' },
    };
  }

  if (has('pas intéressé', 'non merci', 'stop', 'pub')) {
    return {
      intent: 'objection',
      confidence: 0.7,
      summary: 'Refus / objection.',
      suggestedNextAction: 'stop_autopilot',
      proposedReply: { body: 'Merci pour votre retour. Je n’insiste pas. Bonne journée.' },
    };
  }

  if (has('oui', 'ok', 'd’accord', 'quand', 'rdv', 'rendez-vous', 'appel', 'dispo')) {
    return {
      intent: 'positive',
      confidence: 0.75,
      summary: 'Intérêt exprimé / demande de RDV.',
      suggestedNextAction: 'reply',
      proposedReply: {
        body:
          "Merci ! Quel créneau vous arrange (2 options) ?\n— Option 1 : demain matin\n— Option 2 : demain après-midi\n\nEt le meilleur numéro pour vous joindre ?",
      },
    };
  }

  if (has('combien', 'tarif', 'prix', 'coût', 'devis')) {
    return {
      intent: 'question',
      confidence: 0.75,
      summary: 'Question sur le prix.',
      suggestedNextAction: 'reply',
      proposedReply: {
        body:
          "Merci ! Pour vous donner un tarif juste :\n1) Votre service principal ?\n2) Votre ville/zone ?\n3) Vous avez déjà un site ?\n\nJe vous réponds avec une fourchette claire.",
      },
    };
  }

  if (has('absent', 'out of office', 'vacances', 'de retour le')) {
    return {
      intent: 'out_of_office',
      confidence: 0.7,
      summary: "Réponse automatique d'absence.",
      suggestedNextAction: 'schedule_followup',
      proposedReply: { body: 'Merci, je reviens vers vous à votre retour.' },
    };
  }

  return {
    intent: 'unknown',
    confidence: 0.4,
    summary: 'Réponse non classée.',
    suggestedNextAction: 'reply',
    proposedReply: { body: 'Merci pour votre retour. Pouvez-vous me dire ce qui vous intéresse le plus ?' },
  };
}
