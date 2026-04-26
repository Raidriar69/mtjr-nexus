'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function SetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');

  // Create state
  const [createForm, setCreateForm] = useState({ username: '', password: '', confirm: '' });
  const [createLoading, setCreateLoading] = useState(false);

  // Reset state
  const [resetForm, setResetForm] = useState({ password: '', confirm: '' });
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    fetch('/api/setup')
      .then((r) => r.json())
      .then((d) => {
        setAdminExists(!d.setupRequired);
        if (d.username) setAdminUsername(d.username);
      })
      .finally(() => setChecking(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (createForm.password !== createForm.confirm) { toast.error('Passwords do not match'); return; }
    setCreateLoading(true);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: createForm.username, password: createForm.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Admin "${data.username}" created! Go to login.`);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      toast.error(err.message);
      setCreateLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (resetForm.password !== resetForm.confirm) { toast.error('Passwords do not match'); return; }
    setResetLoading(true);
    try {
      const res = await fetch('/api/setup/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetForm.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdminUsername(data.username);
      toast.success(`Password reset! Login with username: ${data.username}`);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      toast.error(err.message);
      setResetLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Checking...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {!adminExists ? (
          // ── CREATE ADMIN ──────────────────────────────────────────
          <>
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">⚡</div>
              <h1 className="text-2xl font-bold text-white">First-Time Admin Setup</h1>
              <p className="text-gray-500 mt-2 text-sm">Create your admin account. Page locks after setup.</p>
            </div>
            <div className="bg-gray-900 border border-amber-500/30 rounded-2xl p-8">
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Admin Username</label>
                  <input
                    type="text" required
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="e.g. admin"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
                  <input
                    type="password" required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Min 8 characters"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Confirm Password</label>
                  <input
                    type="password" required
                    value={createForm.confirm}
                    onChange={(e) => setCreateForm({ ...createForm, confirm: e.target.value })}
                    placeholder="Repeat password"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <Button type="submit" className="w-full !bg-amber-500 hover:!bg-amber-400 !text-gray-900" size="lg" loading={createLoading}>
                  Create Admin Account
                </Button>
              </form>
            </div>
          </>
        ) : (
          // ── RESET ADMIN PASSWORD ──────────────────────────────────
          <>
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🔑</div>
              <h1 className="text-2xl font-bold text-white">Reset Admin Password</h1>
              {adminUsername && (
                <p className="text-violet-400 mt-2 font-mono text-sm">Username: {adminUsername}</p>
              )}
              <p className="text-gray-500 mt-1 text-sm">Set a new password for the existing admin account.</p>
            </div>
            <div className="bg-gray-900 border border-violet-500/30 rounded-2xl p-8">
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">New Password</label>
                  <input
                    type="password" required
                    value={resetForm.password}
                    onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                    placeholder="Min 8 characters"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Confirm Password</label>
                  <input
                    type="password" required
                    value={resetForm.confirm}
                    onChange={(e) => setResetForm({ ...resetForm, confirm: e.target.value })}
                    placeholder="Repeat password"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" loading={resetLoading}>
                  Reset Password & Go to Login
                </Button>
              </form>
              <p className="text-center mt-4">
                <Link href="/login" className="text-gray-500 hover:text-gray-400 text-sm transition-colors">
                  Try logging in instead →
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
