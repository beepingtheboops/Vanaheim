'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function MagicLinkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const isReset = searchParams.get('reset') === 'true';
    
    if (!token) {
      setStatus('error');
      setError('Invalid magic link');
      return;
    }

    async function verifyToken() {
      try {
        const res = await fetch('/api/auth/magic-link/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, isReset }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setStatus('success');
          setTimeout(() => {
            // Redirect to settings page to setup passkey
            if (data.shouldSetupPasskey) {
              window.location.href = '/dashboard/settings?setup=passkey';
            } else {
              window.location.href = '/dashboard';
            }
          }, 1500);
        } else {
          setStatus('error');
          setError(data.error || 'Verification failed');
        }
      } catch {
        setStatus('error');
        setError('An error occurred');
      }
    }

    verifyToken();
  }, [searchParams]);

  return (
    <div className="grain-overlay min-h-screen bg-void flex items-center justify-center p-6">
      <div
        className="max-w-md w-full rounded-2xl p-8 text-center"
        style={{
          background: 'rgba(19, 22, 29, 0.8)',
          border: '1px solid rgba(201, 168, 76, 0.15)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
            <h1 className="text-2xl font-display text-bone mb-2">Verifying...</h1>
            <p className="text-bone/50">Please wait while we sign you in</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-display text-bone mb-2">Success!</h1>
            <p className="text-bone/50">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-display text-bone mb-2">Verification Failed</h1>
            <p className="text-bone/50 mb-6">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 rounded-lg bg-gold/10 border border-gold/20 text-gold hover:bg-gold/20 transition-colors"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
