import Link from 'next/link';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="no-print border-b bg-white p-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/app" className="font-semibold">TaktFlow</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/app">Projects</Link>
            <Link href="/app/upgrade">Upgrade</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4">{children}</main>
    </div>
  );
}
