export type SubscriptionStatus = 'free' | 'pro' | 'trial';

export type OrgPlan = {
  subscription_status: SubscriptionStatus;
};

const defaultPlan: OrgPlan = { subscription_status: 'free' };

export const normalizePlan = (org: Partial<OrgPlan> | null | undefined): OrgPlan => {
  if (!org?.subscription_status) return defaultPlan;
  return org.subscription_status === 'pro' || org.subscription_status === 'trial' || org.subscription_status === 'free'
    ? { subscription_status: org.subscription_status }
    : defaultPlan;
};

export const isPro = (org: Partial<OrgPlan> | null | undefined) => normalizePlan(org).subscription_status === 'pro';
export const canUseBaseline = (org: Partial<OrgPlan> | null | undefined) => isPro(org);
export const canUseAnalytics = (org: Partial<OrgPlan> | null | undefined) => isPro(org);
export const canUseShareLinks = (org: Partial<OrgPlan> | null | undefined) => isPro(org);
export const canExportLogo = (org: Partial<OrgPlan> | null | undefined) => isPro(org);
export const showWatermark = (org: Partial<OrgPlan> | null | undefined) => !isPro(org);
export const zoneLimit = (org: Partial<OrgPlan> | null | undefined) => (isPro(org) ? Number.POSITIVE_INFINITY : 25);
export const projectLimit = (org: Partial<OrgPlan> | null | undefined) => (isPro(org) ? Number.POSITIVE_INFINITY : 1);
