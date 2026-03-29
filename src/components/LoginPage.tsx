'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ChevronRight, Plus, Fingerprint } from 'lucide-react';
import {
  startAuthentication,
} from '@simplewebauthn/browser';

const TURNSTILE_SITE_KEY = '0x4AAAAAACr241t07alup8tw';

const FAMILY_QUICK_LOGIN = [
  { name: 'Dad', email: 'matt@thewillsons.com', icon: 'dad' },
  { name: 'Noonie', email: 'noonie@thewillsons.com', icon: 'noonie' },
  { name: 'Abbat', email: 'abbat@thewillsons.com', icon: 'abbat' },
  { name: 'Odin', email: 'odin@thewillsons.com', icon: 'odin' },
];

const PASSKEY_EMAILS = ['matt@thewillsons.com', 'noonie@thewillsons.com', 'odin@thewillsons.com', 'abbat@thewillsons.com'];

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
  abbat: AbbatIcon,
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
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (window as any).onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
    };
    if (!document.getElementById('turnstile-script')) {
      const script = document.createElement('script');
      script.id = 'turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const handleQuickSelect = async (member: (typeof FAMILY_QUICK_LOGIN)[0]) => {
    setSelectedMember(member.name);
    setEmail(member.email);
    setPassword('');
    setError('');
    setShowPasswordForm(false);

    // If approved for passkey, try biometric auth immediately
    if (PASSKEY_EMAILS.includes(member.email)) {
      await attemptPasskeyAuth(member.email);
    } else {
      setShowPasswordForm(true);
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
        // No passkey registered — fall back to password
        setShowPasswordForm(true);
        setPasskeyLoading(false);
        return;
      }

      const options = await optionsRes.json();

      if (!options.allowCredentials?.length) {
        setShowPasswordForm(true);
        setPasskeyLoading(false);
        return;
      }

      // Trigger Face ID / Touch ID / PIN
      const assertion = await startAuthentication({ optionsJSON: options });

      // Verify with server
      const verifyRes = await fetch('/api/auth/passkey/auth-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...assertion, userId: options.userId }),
      });

      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        // Update auth context
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          router.push('/dashboard');
        }
      } else {
        setError(verifyData.error || 'Passkey authentication failed');
        setShowPasswordForm(true);
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        // User cancelled biometric — fall back to password
        setShowPasswordForm(true);
      } else {
        setShowPasswordForm(true);
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!turnstileToken) {
      setError('Please complete the security check');
      return;
    }
    setIsLoading(true);
    const result = await login(email, password, turnstileToken);
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Login failed');
      setIsLoading(false);
      if ((window as any).turnstile && turnstileRef.current) {
        (window as any).turnstile.reset(turnstileRef.current);
        setTurnstileToken('');
      }
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
                const isApproved = PASSKEY_EMAILS.includes(member.email);
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
                    {/* Fingerprint indicator for passkey users */}
                    {isApproved && (
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

          {/* Password form — shown after passkey fails/cancelled or for non-passkey users */}
          {!passkeyLoading && showPasswordForm && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)' }} />
                <div className="flex gap-2">
                  <span style={{ color: 'rgba(201,168,76,0.25)', fontSize: 12 }}>◆</span>
                  <span style={{ color: 'rgba(201,168,76,0.15)', fontSize: 8, lineHeight: '12px' }}>●</span>
                  <span style={{ color: 'rgba(201,168,76,0.25)', fontSize: 12 }}>◆</span>
                </div>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)' }} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label style={{ display: 'block', fontSize: 10, letterSpacing: 3, color: 'rgba(201,168,76,0.55)', marginBottom: 8, textTransform: 'uppercase', fontFamily: "'Cinzel', serif" }}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@thewillsons.com" required autoComplete="email" />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 10, letterSpacing: 3, color: 'rgba(201,168,76,0.55)', marginBottom: 8, textTransform: 'uppercase', fontFamily: "'Cinzel', serif" }}>Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'rgba(138,109,43,0.4)' }}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Turnstile */}
                <div className="flex justify-center">
                  <div style={{ display: turnstileToken ? 'none' : 'block' }}>
                    <div ref={turnstileRef} className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-theme="dark" data-callback="onTurnstileSuccess" />
                  </div>
                  {turnstileToken && (
                    <div className="flex items-center gap-2 text-xs py-2" style={{ color: 'rgba(34,197,94,0.7)', fontFamily: "'Cinzel', serif", letterSpacing: 2 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Verified
                    </div>
                  )}
                </div>

                {error && (
                  <div style={{ fontSize: 13, textAlign: 'center', padding: '10px 16px', borderRadius: 10, background: 'rgba(139, 37, 0, 0.12)', color: '#f87171', border: '1px solid rgba(139, 37, 0, 0.25)' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={isLoading || !email || !password} className="w-full py-4 rounded-xl font-semibold text-sm uppercase transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, #8a6d2b 0%, #c9a84c 50%, #8a6d2b 100%)', color: '#0a0c10', boxShadow: '0 4px 24px rgba(201, 168, 76, 0.15), inset 0 1px 0 rgba(232,212,139,0.3)', fontFamily: "'Cinzel', serif", letterSpacing: 4 }}>
                  {isLoading ? <div className="w-5 h-5 border-2 border-void/30 border-t-void rounded-full animate-spin" /> : <>Enter the Realm<ChevronRight size={16} /></>}
                </button>
              </form>
            </>
          )}

          {/* Initial state — prompt to select sigil */}
          {!passkeyLoading && !showPasswordForm && !selectedMember && (
            <p style={{ textAlign: 'center', fontSize: 11, letterSpacing: 2, color: 'rgba(201,168,76,0.3)', fontFamily: "'Cinzel', serif" }}>
              Select your sigil above to enter
            </p>
          )}
        </div>

        <div className="text-center mt-8" style={{ fontSize: 14, letterSpacing: 8, color: 'rgba(201,168,76,0.12)' }}>
          ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ
        </div>
      </div>

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
