'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn(email, password);
    if (!result.ok) {
      setLoading(false);
      setError(result.error);
      return;
    }
    setLoginSuccess(true);
    router.push('/dashboard');
    router.refresh();
  }

  if (loginSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="card p-8 flex flex-col items-center justify-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600 ring-8 ring-green-500/10 animate-bounce">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-ink-900">Login Successful!</h2>
            <p className="text-sm text-ink-500 animate-pulse">Loading dashboard data...</p>
            <div className="relative h-1.5 w-32 overflow-hidden rounded-full bg-ink-100 mt-2">
              <div className="absolute top-0 bottom-0 left-0 h-full w-1/2 bg-green-600 rounded-full animate-progressBar" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center flex flex-col items-center">
          <img src="/logo.png" alt="Sree Vaaraahii Building Solutions" className="h-28 w-auto object-contain mb-3" />
          <h1 className="text-base font-semibold text-ink-900">Sree Vaaraahii Building Solutions</h1>
          <p className="text-xs text-ink-500">Sales & Profit Management</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
