export type OrgPlan = {
  subscription_status: 'free' | 'pro' | 'trial';
};

export const isPro = (org: OrgPlan) => org.subscription_status === 'pro';
export const canUseBaseline = (org: OrgPlan) => isPro(org);
export const canUseAnalytics = (org: OrgPlan) => isPro(org);
export const canUseShareLinks = (org: OrgPlan) => isPro(org);
export const canExportLogo = (org: OrgPlan) => isPro(org);
export const showWatermark = (org: OrgPlan) => !isPro(org);
export const zoneLimit = (org: OrgPlan) => (isPro(org) ? Number.POSITIVE_INFINITY : 25);
export const projectLimit = (org: OrgPlan) => (isPro(org) ? Number.POSITIVE_INFINITY : 1);
