import { AppShell } from '@/components/ui/AppShell';

export default function UpgradePage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">Upgrade to Pro</h1>
      <p className="mt-2">Stripe checkout integration TODO. Add webhook to update organizations.subscription_status.</p>
    </AppShell>
  );
}
