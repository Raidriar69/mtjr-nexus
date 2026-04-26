'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    if (!USERNAME_RE.test(form.username)) {
      return 'Username must be 3–20 characters: letters, numbers, or underscores only';
    }
    if (!form.email.includes('@')) return 'Please enter a valid email address';
    if (!PASSWORD_RE.test(form.password)) {
      return 'Password needs 8+ characters with uppercase, lowercase, and a number';
    }
    if (form.password !== form.confirm) return 'Passwords do not match';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          name: form.username,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      toast.success('Account created! Signing you in...');

      const result = await signIn('credentials', {
        identifier: form.username,
        password: form.password,
        ipKey: 'register',
        redirect: false,
      });

      if (result?.error) {
        router.push('/login');
      } else {
        router.push('/products');
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  const usernameValid = form.username.length === 0 || USERNAME_RE.test(form.username);
  const passwordStrong = form.password.length === 0 || PASSWORD_RE.test(form.password);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <span className="text-white font-bold text-2xl">
              Game<span className="text-violet-400">Vault</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-500 mt-1 text-sm">Free to sign up — browse and buy instantly</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Username</label>
              <input
                type="text"
                required
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="coolgamer123"
                className={`w-full bg-gray-800 border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors ${
                  usernameValid ? 'border-gray-700 focus:border-violet-500' : 'border-red-500/60'
                }`}
              />
              {!usernameValid && (
                <p className="text-red-400 text-xs mt-1">3–20 characters: letters, numbers, underscores only</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 8 chars, upper + lower + number"
                className={`w-full bg-gray-800 border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors ${
                  passwordStrong ? 'border-gray-700 focus:border-violet-500' : 'border-amber-500/60'
                }`}
              />
              {form.password.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {[
                    { ok: form.password.length >= 8, label: '8+ chars' },
                    { ok: /[A-Z]/.test(form.password), label: 'Uppercase' },
                    { ok: /[a-z]/.test(form.password), label: 'Lowercase' },
                    { ok: /\d/.test(form.password), label: 'Number' },
                  ].map(({ ok, label }) => (
                    <span
                      key={label}
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-600'
                      }`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Confirm Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                placeholder="Repeat password"
                className={`w-full bg-gray-800 border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors ${
                  form.confirm.length > 0 && form.confirm !== form.password
                    ? 'border-red-500/60'
                    : 'border-gray-700 focus:border-violet-500'
                }`}
              />
            </div>

            <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>
              Create Account
            </Button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6 leading-relaxed">
          By creating an account you agree to our{' '}
          <Link href="/legal/terms" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/legal/refund" className="hover:text-gray-400 transition-colors">Refund Policy</Link>
        </p>
      </div>
    </div>
  );
}
