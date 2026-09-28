'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  clearToken, getPreview, getToken, MeResponse, ModuleMeta, pfetch, setPreview,
} from '@/lib/platformApi';

export default function DashLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [allModules, setAllModules] = useState<ModuleMeta[] | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreviewState] = useState<string[]>([]);

  const reload = useCallback(async () => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    try {
      const data = await pfetch<MeResponse>('/api/p/me');
      setMe(data);
      setPreviewState(getPreview());
    } catch {
      setFailed(true);
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    reload();
  }, [reload, pathname]);

  async function openPreview() {
    setPreviewOpen((v) => !v);
    if (!allModules) {
      try {
        setAllModules(await pfetch<ModuleMeta[]>('/api/p/modules'));
      } catch {
        /* auth redirect handles it */
      }
    }
  }

  function togglePreview(key: string) {
    const next = preview.includes(key)
      ? preview.filter((k) => k !== key)
      : [...preview, key];
    setPreview(next);
    setPreviewState(next);
    reload();
  }

  if (failed || !me) {
    return (
      <main className="min-h-screen bg-zinc-50 flex items-center justify-center text-sm text-zinc-500">
        Loading dashboard...
      </main>
    );
  }

  const entitledKeys = me.modules.map((m) => m.key);

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <aside className="w-60 shrink-0 bg-white border-r border-zinc-200 flex flex-col">
        <div className="px-4 py-4 border-b border-zinc-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-orange-600 text-white text-sm font-bold flex items-center justify-center">
            {me.tenant.logo_text || 'SS'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-zinc-900 truncate">SpotSense</div>
            <div className="text-[11px] text-zinc-500 truncate">{me.tenant.name}</div>
          </div>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          <Link href="/dash"
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/dash'
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-zinc-600 hover:bg-zinc-50'}`}>
            Overview
          </Link>
          {me.modules.map((m) => (
            <Link key={m.key} href={m.route}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === m.route
                      ? 'bg-orange-50 text-orange-700'
                      : 'text-zinc-600 hover:bg-zinc-50'}`}>
              <span className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: m.color }} />
              <span className="truncate">{m.name}</span>
            </Link>
          ))}
          {me.user.role === 'admin' ? (
            <Link href="/dash/admin"
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/dash/admin'
                      ? 'bg-orange-50 text-orange-700'
                      : 'text-zinc-600 hover:bg-zinc-50'}`}>
              Admin
            </Link>
          ) : null}
        </nav>
        <div className="p-3 border-t border-zinc-100 text-[11px] text-zinc-500">
          <div className="truncate">{me.user.name} ({me.user.role})</div>
          <button onClick={() => { clearToken(); router.replace('/login'); }}
                  className="mt-1 text-orange-600 hover:text-orange-700 font-medium">
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {me.user.role === 'admin' ? (
          <div className="bg-white border-b border-zinc-200 px-6 py-2 flex items-center gap-3">
            <button onClick={openPreview}
                    className="text-xs font-semibold text-zinc-600 border border-zinc-300 rounded-md px-2.5 py-1 hover:bg-zinc-50">
              View as client
            </button>
            {preview.length > 0 ? (
              <span className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-0.5">
                Previewing {preview.length} module{preview.length === 1 ? '' : 's'}: {preview.join(', ')}
              </span>
            ) : (
              <span className="text-xs text-zinc-400">
                Full entitlement ({entitledKeys.length} modules)
              </span>
            )}
            {previewOpen && allModules ? (
              <div className="flex flex-wrap gap-1.5 ml-2">
                {allModules.map((m) => (
                  <button key={m.key} onClick={() => togglePreview(m.key)}
                          className={`text-[11px] px-2 py-0.5 rounded-full border ${
                            preview.includes(m.key)
                              ? 'bg-orange-600 text-white border-orange-600'
                              : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50'}`}>
                    {m.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
