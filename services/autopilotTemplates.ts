
export const DEFAULT_SEQUENCE = [
  { delayDays: 0, channel: 'email', templateKey: 'intro_1' },
  { delayDays: 2, channel: 'email', templateKey: 'followup_1' },
  { delayDays: 5, channel: 'whatsapp', templateKey: 'quick_ping' },
  { delayDays: 10, channel: 'email', templateKey: 'last_call' },
];

export const TEMPLATE_LIBRARY: Record<string, string> = {
  intro_1: "Bonjour {{name}},\n\nJ'ai analysé la présence en ligne de {{business}} et j'ai remarqué quelques opportunités manquées sur Google Maps.\n\nJ'ai préparé un audit rapide. Êtes-vous la bonne personne pour en discuter ?",
  followup_1: "Bonjour {{name}},\n\nJe me permets de vous relancer concernant mon précédent message sur votre visibilité locale. Avez-vous eu le temps d'y jeter un œil ?",
  quick_ping: "Bonjour {{name}}, c'est au sujet de {{business}}. Avez-vous 5min pour un appel rapide ?",
  last_call: "Bonjour {{name}},\n\nJe clôture votre dossier pour le moment. Je reste disponible si vous souhaitez améliorer votre acquisition client plus tard.\n\nCordialement.",
};
