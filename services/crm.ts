
import { Prospect, CRMStage } from '../types';

export const ensureCRM = (p: Prospect): Prospect => {
  if (p.crm) return p;

  return {
    ...p,
    crm: {
      stage: 'NEW',
      activities: [],
      followUps: [],
    },
  };
};

export const addActivity = (p: Prospect, type: any, content: string): Prospect => {
  const crm = p.crm || ensureCRM(p).crm!;
  return {
    ...p,
    crm: {
      ...crm,
      activities: [
        ...crm.activities,
        { id: `act_${Date.now()}`, type, content, createdAt: Date.now() },
      ],
      lastContactAt: Date.now(),
    },
  };
};

export const addFollowUp = (p: Prospect, days: number, note?: string): Prospect => {
  const crm = p.crm || ensureCRM(p).crm!;
  const dueAt = Date.now() + days * 24 * 60 * 60 * 1000;

  return {
    ...p,
    crm: {
      ...crm,
      followUps: [
        ...crm.followUps,
        { id: `fu_${Date.now()}`, dueAt, note, done: false },
      ],
    },
  };
};

export const completeFollowUp = (p: Prospect, followUpId: string): Prospect => {
    const crm = p.crm;
    if (!crm) return p;
    
    return {
        ...p,
        crm: {
            ...crm,
            followUps: crm.followUps.map(f => f.id === followUpId ? { ...f, done: true } : f)
        }
    }
}

export const setStage = (p: Prospect, stage: CRMStage): Prospect => {
    const crm = p.crm || ensureCRM(p).crm!;
    return {
        ...p,
        crm: {
            ...crm,
            stage
        }
    };
};
