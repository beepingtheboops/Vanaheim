'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Fingerprint } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';

const FAMILY_QUICK_LOGIN = [
  { name: 'Dad', email: 'mattwillson@outlook.com', icon: 'dad' },
  { name: 'Noonie', email: 'laurentalbott90@gmail.com', icon: 'noonie' },
  { name: 'Abbat', email: 'sbkwillson@hotmail.com', icon: 'abbat' },
  { name: 'Odin', email: 'odinwillson@gmail.com', icon: 'odin' },
];

const PASSKEY_EMAILS = ['mattwillson@outlook.com', 'laurentalbott90@gmail.com', 'odinwillson@gmail.com', 'sbkwillson@hotmail.com'];

function DadIcon({ active }: { active: boolean }) {
  const c = active ? '#c9a84c' : '#6b7280';
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
      <path d="M9 24C9 16 13 9 21 9C29 9 33 16 33 24" stroke={c} strokeWidth="1.5" fill="none"/>
      <path d="M9 20L4 10L7 12" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M33 20L38 10L35 12" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="9" y1="20" x2="33" y2="20" stroke={c} strokeWidth="1.2"/>
      <line x1="21" y1="18" x2="21" y2="24" stroke={c} strokeWidth="1" opacity="0.6"/>
      <circle cx="21" cy="26" r="7" stroke={c} strokeWidth="1.2" fill="none"/>
      <circle cx="18" cy="25" r="1" fill={c}/>
      <circle cx="24" cy="25" r="1" fill={c}/>
      <path d="M15 29C16 33 18 36 21 37C24 36 26 33 27 29" stroke={c} strokeWidth="1.2" fill="none"/>
    </svg>
  );
}

function NoonieIcon({ active }: { active: boolean }) {
  const c = active ? '#c9a84c' : '#6b7280';
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
      <path d="M11 18C11 12 15 8 21 8C27 8 31 12 31 18L31 30" stroke={c} strokeWidth="1.2" fill="none"/>
      <path d="M11 18L11 30" stroke={c} strokeWidth="1.2" fill="none"/>
      <path d="M12 16L15 11L18 14L21 10L24 14L27 11L30 16" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="21" cy="22" r="7" stroke={c} strokeWidth="1.2" fill="none"/>
      <circle cx="18.5" cy="21" r="1" fill={c}/>
      <circle cx="23.5" cy="21" r="1" fill={c}/>
      <path d="M19 25.5Q21 27 23 25.5" stroke={c} strokeWidth="0.8" fill="none"/>
      <path d="M11 24C9 26 9 30 10 34" stroke={c} strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M31 24C33 26 33 30 32 34" stroke={c} strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <circle cx="10" cy="34" r="1.5" stroke={c} strokeWidth="0.8" fill="none"/>
      <circle cx="32" cy="34" r="1.5" stroke={c} strokeWidth="0.8" fill="none"/>
    </svg>
  );
}

function AbbatIcon({ active }: { active: boolean }) {
  const c = active ? '#c9a84c' : '#6b7280';
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
      <path d="M10 22C10 14 14 8 21 8C28 8 32 14 32 22" stroke={c} strokeWidth="1.5" fill="none"/>
      <line x1="21" y1="4" x2="21" y2="9" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 22L32 22" stroke={c} strokeWidth="1.3"/>
      <circle cx="21" cy="27" r="7" stroke={c} strokeWidth="1.2" fill="none"/>
      <line x1="17" y1="26" x2="19.5" y2="25.5" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="22.5" y1="25.5" x2="25" y2="26" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M16 31C17 34 21 36 21 36C21 36 25 34 26 31" stroke={c} strokeWidth="1.2" fill="none"/>
    </svg>
  );
}

function OdinIcon({ active }: { active: boolean }) {
  const c = active ? '#c9a84c' : '#6b7280';
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
      <path d="M10 24C10 17 13 11 20 10C27 11 31 15 31 22" stroke={c} strokeWidth="1.4" fill="none"/>
      <path d="M11 20L8 14" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M30 18L33 12" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M10 22L31 20" stroke={c} strokeWidth="1.1"/>
      <circle cx="21" cy="27" r="6" stroke={c} strokeWidth="1.2" fill="none"/>
      <circle cx="18.5" cy="26" r="1.5" stroke={c} strokeWidth="0.8" fill="none"/>
      <circle cx="18.5" cy="26" r="0.6" fill={c}/>
      <circle cx="23.5" cy="26" r="1.5" stroke={c} strokeWidth="0.8" fill="none"/>
      <circle cx="23.5" cy="26" r="0.6" fill={c}/>
      <path d="M19 30Q21 32 23 30" stroke={c} strokeWidth="0.8" fill="none"/>
    </svg>
  );
}

const iconMap: Record<string, React.FC<{ active: boolean }>> = {
  dad: DadIcon,
  noonie: NoonieIcon,
  abbat: DadIcon,  // Abbat uses same icon as Dad
  odin: OdinIcon,
};

function VegvisirSymbol() {
  return (
    <svg width="56" height="56" viewBox="0 0 100 100" fill="none" className="mx-auto mb-3" style={{ opacity: 0.7 }}>
      <circle cx="50" cy="50" r="42" stroke="#c9a84c" strokeWidth="1" />
      <circle cx="50" cy="50" r="36" stroke="#c9a84c" strokeWidth="0.5" opacity="0.5"/>
      <line x1="50" y1="14" x2="50" y2="86" stroke="#c9a84c" strokeWidth="1.2"/>
      <line x1="14" y1="50" x2="86" y2="50" stroke="#c9a84c" strokeWidth="1.2"/>
      <line x1="24" y1="24" x2="76" y2="76" stroke="#c9a84c" strokeWidth="0.8" opacity="0.7"/>
      <line x1="76" y1="24" x2="24" y2="76" stroke="#c9a84c" strokeWidth="0.8" opacity="0.7"/>
      <circle cx="50" cy="50" r="5" stroke="#c9a84c" strokeWidth="1"/>
      <circle cx="50" cy="50" r="2" fill="#c9a84c"/>
      <polygon points="50,14 47,22 53,22" fill="#c9a84c" opacity="0.7"/>
      <polygon points="50,86 47,78 53,78" fill="#c9a84c" opacity="0.7"/>
      <polygon points="14,50 22,47 22,53" fill="#c9a84c" opacity="0.7"/>
      <polygon points="86,50 78,47 78,53" fill="#c9a84c" opacity="0.7"/>
      <line x1="50" y1="14" x2="44" y2="22" stroke="#c9a84c" strokeWidth="0.8"/>
      <line x1="50" y1="14" x2="56" y2="22" stroke="#c9a84c" strokeWidth="0.8"/>
      <line x1="50" y1="86" x2="44" y2="78" stroke="#c9a84c" strokeWidth="0.8"/>
      <line x1="50" y1="86" x2="56" y2="78" stroke="#c9a84c" strokeWidth="0.8"/>
    </svg>
  );
}

function RuneParticles() {
  const runes = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᛃ','ᛇ','ᛈ','ᛉ','ᛊ','ᛏ','ᛒ','ᛖ','ᛗ','ᛚ','ᛜ','ᛞ','ᛟ'];
  const [particles, setParticles] = useState<Array<{id:number;rune:string;x:number;y:number;size:number;dur:number;delay:number}>>([]);
  useEffect(() => {
    setParticles(Array.from({ length: 24 }, (_, i) => ({
      id: i,
      rune: runes[Math.floor(Math.random() * runes.length)],
      x: 3 + Math.random() * 94,
      y: 15 + Math.random() * 75,
      size: 16 + Math.random() * 22,
      dur: 8 + Math.random() * 14,
      delay: Math.random() * 12,
    })));
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div key={p.id} className="absolute" style={{
          left: `${p.x}%`, top: `${p.y}%`,
          fontSize: `${p.size}px`, color: '#c9a84c', opacity: 0,
          fontFamily: "'Cinzel', serif",
          animation: `runeFloat ${p.dur}s ease-in-out infinite`,
          animationDelay: `${p.delay}s`,
        }}>{p.rune}</div>
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [usersWithPasskeys, setUsersWithPasskeys] = useState<Set<string>>(new Set());

  // Fetch which users have passkeys on mount
  useEffect(() => {
    const checkPasskeys = async () => {
      const results = await Promise.all(
        FAMILY_QUICK_LOGIN.map(async (member) => {
          try {
            const res = await fetch('/api/auth/check-passkey', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: member.email }),
            });
            const data = await res.json();
            return data.hasPasskey ? member.email : null;
          } catch {
            return null;
          }
        })
      );
      setUsersWithPasskeys(new Set(results.filter(Boolean) as string[]));
    };
    checkPasskeys();
  }, []);

  const handleQuickSelect = async (member: (typeof FAMILY_QUICK_LOGIN)[0]) => {
    setSelectedMember(member.name);
    setError('');

    try {
      // Check if user has passkey registered
      const checkRes = await fetch('/api/auth/check-passkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: member.email }),
      });

      const { hasPasskey, sendMagicLink } = await checkRes.json();

      if (hasPasskey) {
        // User has passkey - prompt for passkey auth
        await attemptPasskeyAuth(member.email);
      } else if (sendMagicLink) {
        // User doesn't have passkey - send magic link automatically
        const magicLinkRes = await fetch('/api/auth/magic-link/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: member.email }),
        });

        const data = await magicLinkRes.json();

        if (data.success) {
          setError('');
          alert(`Magic link sent to ${member.email}! Check your email to sign in.`);
          setSelectedMember(null); // Reset selection
        } else {
          setError(data.error || 'Failed to send magic link');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  const attemptPasskeyAuth = async (memberEmail: string) => {
    setPasskeyLoading(true);
    setError('');
    try {
      // Get authentication options
      const optionsRes = await fetch('/api/auth/passkey/auth-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: memberEmail }),
      });

      if (!optionsRes.ok) {
        setError('Failed to get passkey options');
        setPasskeyLoading(false);
        return;
      }

      const options = await optionsRes.json();

      if (!options.allowCredentials?.length) {
        setError('No passkey found');
        setPasskeyLoading(false);
        return;
      }

      // Trigger Face ID / Touch ID / PIN
      const assertion = await startAuthentication(options);

      // Verify with server
      const verifyRes = await fetch('/api/auth/passkey/auth-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...assertion, userId: options.userId }),
      });

      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        window.location.href = '/dashboard';
      } else {
        setError(verifyData.error || 'Passkey authentication failed');
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setError('Passkey authentication cancelled');
      } else {
        setError('Passkey authentication failed');
      }
    } finally {
      setPasskeyLoading(false);
      setSelectedMember(null);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }

    setResetLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/magic-link/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, resetPasskey: true }),
      });

      const data = await res.json();

      if (data.success) {
        setResetSuccess(true);
        setTimeout(() => {
          setShowResetModal(false);
          setResetSuccess(false);
          setResetEmail('');
        }, 3000);
      } else {
        setError(data.error || 'Failed to send reset link');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="grain-overlay min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Base background */}
      <div className="fixed inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 30%, rgba(20,16,8,1) 0%, rgba(10,12,16,1) 60%, #000 100%)'
      }} />

      {/* Yggdrasil image */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.1 }}>
        <img src="/yggdrasil.png" alt="" style={{
          width: '70vmin', height: '70vmin', objectFit: 'contain',
          filter: 'invert(1) sepia(1) saturate(4) hue-rotate(5deg) brightness(0.85)',
        }} />
      </div>

      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.8) 100%)'
      }} />

      <RuneParticles />

      {/* Add to Home Screen */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => alert('To install: tap the Share button (iOS) or menu (Android) and select "Add to Home Screen"')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300"
          style={{
            background: 'rgba(12, 14, 20, 0.85)',
            border: '1px solid rgba(201, 168, 76, 0.25)',
            backdropFilter: 'blur(12px)',
            color: '#c9a84c',
            fontFamily: "'Cinzel', serif",
            fontSize: 11,
            letterSpacing: 1,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          <Plus size={13} strokeWidth={2} />
          Add to Home Screen
        </button>
      </div>

      {/* Cancel */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => router.push('/')}
          style={{
            color: 'rgba(201,168,76,0.35)', fontFamily: "'Cinzel', serif",
            fontSize: 11, letterSpacing: 2, background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          cancel
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8" style={{ animation: 'fadeInDown 1s ease forwards' }}>
          <VegvisirSymbol />
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: 6, color: 'rgba(201,168,76,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Welcome to</p>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(32px, 7vw, 48px)', fontWeight: 700, letterSpacing: '6px', color: '#c9a84c', textShadow: '0 0 40px rgba(201,168,76,0.25)', lineHeight: 1, marginBottom: 8 }}>VANAHEIM</h1>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: 16, letterSpacing: 3, color: 'rgba(201,168,76,0.55)', marginBottom: 6 }}>Willson Family Command Center</p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px flex-1 max-w-20" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4))' }} />
            <span style={{ fontSize: 16, letterSpacing: 8, color: 'rgba(201,168,76,0.45)', fontFamily: "'Cinzel', serif" }}>ᚺ ᛟ ᛗ ᛖ</span>
            <div className="h-px flex-1 max-w-20" style={{ background: 'linear-gradient(270deg, transparent, rgba(201,168,76,0.4))' }} />
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-2xl p-8" style={{
          background: 'rgba(12, 14, 20, 0.85)',
          border: '1px solid rgba(201, 168, 76, 0.12)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(201,168,76,0.05)',
          animation: 'slideUp 0.8s ease forwards',
          animationDelay: '0.3s',
          opacity: 0,
          animationFillMode: 'forwards',
        }}>

          {/* Sigil selector */}
          <div className="mb-7">
            <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', textAlign: 'center', marginBottom: 14, fontFamily: "'Cinzel', serif" }}>
              Choose your sigil
            </p>
            <div className="grid grid-cols-4 gap-3">
              {FAMILY_QUICK_LOGIN.map((member) => {
                const IconComponent = iconMap[member.icon];
                const isActive = selectedMember === member.name;
                const hasPasskey = usersWithPasskeys.has(member.email);
                return (
                  <button
                    key={member.name}
                    onClick={() => handleQuickSelect(member)}
                    disabled={passkeyLoading}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-300 relative"
                    style={{
                      background: isActive ? 'rgba(201, 168, 76, 0.08)' : 'rgba(20, 22, 30, 0.6)',
                      border: isActive ? '1px solid rgba(201, 168, 76, 0.35)' : '1px solid rgba(107, 114, 128, 0.08)',
                      boxShadow: isActive ? '0 0 20px rgba(201,168,76,0.08)' : 'none',
                    }}
                  >
                    <IconComponent active={isActive} />
                    <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, color: isActive ? '#c9a84c' : '#d1c7b7', fontFamily: "'Cinzel', serif" }}>
                      {member.name}
                    </span>
                    {hasPasskey && (
                      <div className="absolute top-1 right-1" title="Face ID / Touch ID">
                        <Fingerprint size={10} style={{ color: isActive ? '#c9a84c' : 'rgba(201,168,76,0.3)' }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Passkey loading state */}
          {passkeyLoading && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Fingerprint size={32} style={{ color: '#c9a84c' }} className="animate-pulse" />
              <p style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: 3, color: 'rgba(201,168,76,0.6)' }}>
                Waiting for biometric...
              </p>
            </div>
          )}

          {/* Error message */}
          {error && !passkeyLoading && (
            <div style={{ fontSize: 13, textAlign: 'center', padding: '10px 16px', borderRadius: 10, background: 'rgba(139, 37, 0, 0.12)', color: '#f87171', border: '1px solid rgba(139, 37, 0, 0.25)', marginBottom: 16 }}>
              {error}
            </div>
          )}

          {/* Reset password link */}
          <div className="text-center mt-6">
            <button
              onClick={() => setShowResetModal(true)}
              className="text-xs transition-colors"
              style={{ 
                color: 'rgba(201,168,76,0.6)', 
                fontFamily: "'Cinzel', serif", 
                letterSpacing: 2,
                textDecoration: 'none'
              }}
            >
              Reset Password
            </button>
          </div>

          {/* Initial state — prompt to select sigil */}
          {!passkeyLoading && !selectedMember && !error && (
            <p style={{ textAlign: 'center', fontSize: 11, letterSpacing: 2, color: 'rgba(201,168,76,0.3)', fontFamily: "'Cinzel', serif", marginTop: 16 }}>
              Select your sigil above to enter
            </p>
          )}
        </div>

        <div className="text-center mt-8" style={{ fontSize: 14, letterSpacing: 8, color: 'rgba(201,168,76,0.12)' }}>
          ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div
            className="max-w-md w-full rounded-2xl p-8"
            style={{
              background: 'rgba(12, 14, 20, 0.95)',
              border: '1px solid rgba(201, 168, 76, 0.25)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
            }}
          >
            {resetSuccess ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl mb-2" style={{ fontFamily: "'Cinzel', serif", color: '#c9a84c' }}>
                  Confirmation Email Sent!
                </h3>
                <p className="text-sm" style={{ color: 'rgba(201,168,76,0.6)', fontFamily: "'Cinzel', serif" }}>
                  Check your email and click the link to confirm the passkey reset
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-xl mb-4 text-center" style={{ fontFamily: "'Cinzel', serif", color: '#c9a84c', letterSpacing: 2 }}>
                  Reset Password
                </h3>
                <p className="text-sm mb-6 text-center" style={{ color: 'rgba(201,168,76,0.6)', fontFamily: "'Cinzel', serif" }}>
                  Enter your email to receive a confirmation link. Your passkey will only be reset after you click the link in the email.
                </p>

                <div className="mb-6">
                  <label style={{ display: 'block', fontSize: 10, letterSpacing: 3, color: 'rgba(201,168,76,0.55)', marginBottom: 8, textTransform: 'uppercase', fontFamily: "'Cinzel', serif" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@thewillsons.com"
                    autoComplete="email"
                    className="w-full"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: 'rgba(20,22,30,0.6)',
                      border: '1px solid rgba(107,114,128,0.2)',
                      color: '#d1c7b7',
                      fontFamily: "'Cinzel', serif",
                    }}
                  />
                </div>

                {error && (
                  <div className="mb-4" style={{ fontSize: 13, textAlign: 'center', padding: '10px 16px', borderRadius: 10, background: 'rgba(139, 37, 0, 0.12)', color: '#f87171', border: '1px solid rgba(139, 37, 0, 0.25)' }}>
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowResetModal(false);
                      setResetEmail('');
                      setError('');
                    }}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm uppercase transition-all duration-300"
                    style={{
                      background: 'rgba(107,114,128,0.1)',
                      color: 'rgba(201,168,76,0.6)',
                      border: '1px solid rgba(107,114,128,0.2)',
                      fontFamily: "'Cinzel', serif",
                      letterSpacing: 2,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={resetLoading || !resetEmail}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm uppercase transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #8a6d2b 0%, #c9a84c 50%, #8a6d2b 100%)',
                      color: '#0a0c10',
                      boxShadow: '0 4px 24px rgba(201, 168, 76, 0.15)',
                      fontFamily: "'Cinzel', serif",
                      letterSpacing: 2,
                    }}
                  >
                    {resetLoading ? (
                      <div className="w-5 h-5 mx-auto border-2 border-void/30 border-t-void rounded-full animate-spin" />
                    ) : (
                      'Send Link'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes runeFloat {
          0% { opacity: 0; transform: translateY(0) scale(0.7); }
          12% { opacity: 0.12; }
          88% { opacity: 0.05; }
          100% { opacity: 0; transform: translateY(-100px) scale(1); }
        }
        @keyframes fadeInDown {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
