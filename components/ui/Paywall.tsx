import Link from 'next/link';

export function Paywall({ feature }: { feature: string }) {
  return (
    <div className="rounded border border-amber-300 bg-amber-50 p-4">
      <p className="font-medium">{feature} is available on Pro.</p>
      <Link href="/app/upgrade" className="mt-2 inline-block text-blue-600 underline">
        Upgrade to Pro
      </Link>
    </div>
  );
}
