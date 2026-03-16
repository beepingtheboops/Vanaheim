'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Shield, ChevronRight } from 'lucide-react';

const FAMILY_QUICK_LOGIN = [
  { name: 'Dad', email: 'dad@thewillsons.com', avatar: '👨' },
  { name: 'Mom', email: 'mom@thewillsons.com', avatar: '👩' },
  { name: 'Alex', email: 'alex@thewillsons.com', avatar: '🧑' },
  { name: 'Emma', email: 'emma@thewillsons.com', avatar: '👧' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const handleQuickSelect = (member: (typeof FAMILY_QUICK_LOGIN)[0]) => {
    setSelectedMember(member.name);
    setEmail(member.email);
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="grain-overlay min-h-screen flex items-center justify-center p-6 relative">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-b from-void via-charcoal to-void" />
      <div className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(201,168,76,0.1) 2px, rgba(201,168,76,0.1) 3px)',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-3">
            <Shield className="w-8 h-8 text-gold" strokeWidth={1.5} />
            <h1 className="font-display text-3xl tracking-wider text-gold">
              HomeBase
            </h1>
          </div>
          <p className="text-sm tracking-[0.3em] uppercase text-gold-dark">
            Family Command Center
          </p>
        </div>

        {/* Login card */}
        <div
          className="rounded-2xl p-8 animate-slide-up"
          style={{
            background: 'rgba(19, 22, 29, 0.9)',
            border: '1px solid rgba(201, 168, 76, 0.1)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Family quick-select */}
          <div className="mb-8">
            <p className="text-xs tracking-[0.2em] uppercase text-gold-dark mb-4 text-center">
              Who&apos;s logging in?
            </p>
            <div className="grid grid-cols-4 gap-3">
              {FAMILY_QUICK_LOGIN.map((member) => (
                <button
                  key={member.name}
                  onClick={() => handleQuickSelect(member)}
                  className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all duration-200"
                  style={{
                    background:
                      selectedMember === member.name
                        ? 'rgba(201, 168, 76, 0.1)'
                        : 'rgba(30, 34, 45, 0.5)',
                    border:
                      selectedMember === member.name
                        ? '1px solid rgba(201, 168, 76, 0.3)'
                        : '1px solid rgba(107, 114, 128, 0.1)',
                  }}
                >
                  <span className="text-2xl">{member.avatar}</span>
                  <span
                    className="text-xs font-medium"
                    style={{
                      color:
                        selectedMember === member.name
                          ? 'var(--gold)'
                          : 'var(--bone)',
                    }}
                  >
                    {member.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-dark/30 to-transparent" />
            <span className="text-xs text-gold-dark tracking-widest">ᛃ</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-dark/30 to-transparent" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs tracking-wider text-gold-dark/70 mb-2 uppercase">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@thewillsons.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs tracking-wider text-gold-dark/70 mb-2 uppercase">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-dark/50 hover:text-gold transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="text-sm text-center py-2 px-4 rounded-lg"
                style={{
                  background: 'rgba(139, 37, 0, 0.15)',
                  color: '#f87171',
                  border: '1px solid rgba(139, 37, 0, 0.3)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-4 rounded-xl font-semibold text-sm tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
                color: 'var(--void)',
                boxShadow: '0 4px 20px rgba(201, 168, 76, 0.2)',
              }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-void/30 border-t-void rounded-full animate-spin" />
              ) : (
                <>
                  Enter the Realm
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gold-dark/30 mt-8 tracking-widest">
          ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ
        </p>
      </div>
    </div>
  );
}
