'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/platformApi';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@spotsense.app');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.push('/dash');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-10 h-10 rounded-lg bg-orange-600 text-white font-bold flex items-center justify-center">
            SS
          </div>
          <div>
            <div className="font-bold text-zinc-900 leading-tight">SpotSense Platform</div>
            <div className="text-xs text-zinc-500">Modular smart parking dashboard</div>
          </div>
        </div>
        <form onSubmit={onSubmit}
              className="bg-white border border-zinc-200 rounded-lg shadow-sm p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)}
                   className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                   autoComplete="username" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">Password</label>
            <input type="password" value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                   autoComplete="current-password" />
          </div>
          {error ? <div className="text-xs text-red-600">{error}</div> : null}
          <button type="submit" disabled={busy}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-semibold rounded-md py-2">
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
          <div className="text-[11px] text-zinc-500 leading-relaxed">
            Demo accounts: admin@spotsense.app, operator@spotsense.app,
            enforce@spotsense.app, password demo1234
          </div>
        </form>
      </div>
    </main>
  );
}
