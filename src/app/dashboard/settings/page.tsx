'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { Shield, Fingerprint, Trash2, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';

interface Passkey {
  id: string;
  device_type: string | null;
  created_at: string;
  last_used_at: string | null;
  backed_up: number;
}

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchPasskeys();
  }, [user]);

  // Auto-trigger passkey registration when redirected from magic link
  useEffect(() => {
    if (user && !loadingPasskeys && passkeys.length === 0) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('setup') === 'passkey') {
        // Clear the URL parameter
        window.history.replaceState({}, '', '/dashboard/settings');
        // Auto-trigger registration
        registerPasskey();
      }
    }
  }, [user, loadingPasskeys, passkeys]);

  const fetchPasskeys = async () => {
    try {
      const res = await fetch('/api/auth/passkey/list');
      if (res.ok) {
        const data = await res.json();
        setPasskeys(data.passkeys || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingPasskeys(false);
    }
  };

  const registerPasskey = async () => {
    setRegistering(true);
    setMessage(null);
    try {
      // Get registration options
      const optionsRes = await fetch('/api/auth/passkey/register-options', {
        method: 'POST',
      });

      if (!optionsRes.ok) {
        const err = await optionsRes.json();
        setMessage({ type: 'error', text: err.error || 'Failed to start registration' });
        return;
      }

      const options = await optionsRes.json();

      // Trigger biometric registration
      const registration = await startRegistration(options);

      // Verify with server
      const verifyRes = await fetch('/api/auth/passkey/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registration),
      });

      const verifyData = await verifyRes.json();

      if (verifyData.verified) {
        setMessage({ type: 'success', text: 'Passkey registered successfully. Your password has been disabled — use Face ID / Touch ID to sign in.' });
        await fetchPasskeys();
        
        // If this was first-time setup (from magic link), redirect to dashboard
        const wasFirstSetup = passkeys.length === 0;
        if (wasFirstSetup) {
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500); // Brief delay to show success message
        }
      } else {
        setMessage({ type: 'error', text: verifyData.error || 'Registration failed' });
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setMessage({ type: 'error', text: 'Registration cancelled' });
      } else {
        setMessage({ type: 'error', text: 'Registration failed — please try again' });
      }
    } finally {
      setRegistering(false);
    }
  };

  const deletePasskey = async (passkeyId: string) => {
    if (!confirm('Remove this passkey? You will need to use email recovery to set up a new one.')) return;
    try {
      const res = await fetch('/api/auth/passkey/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkeyId }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Passkey removed' });
        await fetchPasskeys();
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to remove passkey' });
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  if (loading || !user) return null;

  const APPROVED_EMAILS = ['mattwillson@outlook.com', 'laurentalbott90@gmail.com', 'odinwillson@gmail.com', 'sbkwillson@hotmail.com'];
  const canRegisterPasskey = APPROVED_EMAILS.includes(user.email);

  return (
    <div className="min-h-screen bg-void p-6">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-base transition-colors"
            style={{ color: 'rgba(201,168,76,0.75)', fontFamily: "'Cinzel', serif", letterSpacing: 1 }}
          >
            <ChevronLeft size={20} />
            Dashboard
          </button>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-6 h-6 text-gold" strokeWidth={1.5} />
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 20, letterSpacing: 3, color: '#c9a84c' }}>
            Security Settings
          </h1>
        </div>

        {/* User info */}
        <div className="rounded-xl p-5 mb-6" style={{
          background: 'rgba(19, 22, 29, 0.7)',
          border: '1px solid rgba(201, 168, 76, 0.08)',
        }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{user.avatar}</span>
            <div>
              <p className="font-medium text-bone">{user.name}</p>
              <p className="text-sm text-bone/40">{user.email}</p>
              <p className="text-xs text-gold-dark/50 mt-0.5 capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Passkeys section */}
        <div className="rounded-xl p-5" style={{
          background: 'rgba(19, 22, 29, 0.7)',
          border: '1px solid rgba(201, 168, 76, 0.08)',
        }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Fingerprint size={18} className="text-gold" />
              <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: 2, color: '#c9a84c' }}>
                Passkeys
              </h2>
            </div>
            {canRegisterPasskey && passkeys.length === 0 && (
              <span className="text-xs px-2 py-1 rounded-full" style={{
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.2)',
              }}>Not set up</span>
            )}
            {passkeys.length > 0 && (
              <span className="text-xs px-2 py-1 rounded-full" style={{
                background: 'rgba(34,197,94,0.1)',
                color: '#22c55e',
                border: '1px solid rgba(34,197,94,0.2)',
              }}>Active</span>
            )}
          </div>

          <p className="text-sm text-bone/40 mb-5 leading-relaxed">
            Use Face ID, Touch ID, or your device PIN to sign in without a password.
            {passkeys.length > 0 && ' Your password has been disabled — passkey is your only sign-in method.'}
          </p>

          {/* Message */}
          {message && (
            <div className="flex items-start gap-3 p-4 rounded-xl mb-4" style={{
              background: message.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>
              {message.type === 'success'
                ? <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }} />
                : <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
              }
              <p className="text-sm" style={{ color: message.type === 'success' ? '#22c55e' : '#ef4444' }}>
                {message.text}
              </p>
            </div>
          )}

          {/* Existing passkeys */}
          {!loadingPasskeys && passkeys.length > 0 && (
            <div className="space-y-2 mb-4">
              {passkeys.map(pk => (
                <div key={pk.id} className="flex items-center justify-between p-3 rounded-xl" style={{
                  background: 'rgba(30, 34, 45, 0.6)',
                  border: '1px solid rgba(201,168,76,0.06)',
                }}>
                  <div className="flex items-center gap-3">
                    <Fingerprint size={16} className="text-gold" />
                    <div>
                      <p className="text-sm text-bone/80 capitalize">
                        {pk.device_type?.replace(/_/g, ' ') || 'Device passkey'}
                        {pk.backed_up ? ' · Synced' : ''}
                      </p>
                      <p className="text-xs text-bone/30">
                        Added {formatDate(pk.created_at)}
                        {pk.last_used_at && ` · Last used ${formatDate(pk.last_used_at)}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deletePasskey(pk.id)}
                    className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
                    title="Remove passkey"
                  >
                    <Trash2 size={18} style={{ color: 'rgba(239,68,68,0.7)' }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Register button */}
          {canRegisterPasskey ? (
            <button
              onClick={registerPasskey}
              disabled={registering}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.2)',
                color: '#c9a84c',
                fontFamily: "'Cinzel', serif",
                letterSpacing: 2,
              }}
            >
              {registering ? (
                <>
                  <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Fingerprint size={16} />
                  {passkeys.length > 0 ? 'Add Another Passkey' : 'Set Up Passkey'}
                </>
              )}
            </button>
          ) : (
            <p className="text-xs text-bone/25 text-center py-2">
              Passkey registration is restricted to approved family members
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
