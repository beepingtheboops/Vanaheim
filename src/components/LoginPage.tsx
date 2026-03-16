'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';

const FAMILY_QUICK_LOGIN = [
  { name: 'Dad', email: 'dad@thewillsons.com', icon: 'dad' },
  { name: 'Noonie', email: 'mom@thewillsons.com', icon: 'noonie' },
  { name: 'Abbat', email: 'alex@thewillsons.com', icon: 'abbat' },
  { name: 'Odin', email: 'emma@thewillsons.com', icon: 'odin' },
];

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
      <path d="M17 30C18 34 21 35 21 35" stroke={c} strokeWidth="0.8" fill="none" opacity="0.5"/>
      <path d="M25 30C24 34 21 35 21 35" stroke={c} strokeWidth="0.8" fill="none" opacity="0.5"/>
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
      <path d="M17 29Q21 31 25 29" stroke={c} strokeWidth="0.8" fill="none" opacity="0.6"/>
      <circle cx="21" cy="31" r="1" fill={c} opacity="0.5"/>
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
      <path d="M10 22L8 26" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      <path d="M32 22L34 26" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      <circle cx="21" cy="27" r="7" stroke={c} strokeWidth="1.2" fill="none"/>
      <line x1="17" y1="26" x2="19.5" y2="25.5" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="22.5" y1="25.5" x2="25" y2="26" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M16 31C17 34 21 36 21 36C21 36 25 34 26 31" stroke={c} strokeWidth="1.2" fill="none"/>
      <line x1="24" y1="23" x2="26" y2="27" stroke={c} strokeWidth="0.6" opacity="0.4" strokeLinecap="round"/>
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
      <line x1="28" y1="20" x2="32" y2="35" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      <line x1="30" y1="34" x2="34" y2="36" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

const iconMap: Record<string, React.FC<{ active: boolean }>> = {
  dad: DadIcon, noonie: NoonieIcon, abbat: DadIcon, odin: OdinIcon,
};

function YggdrasilBg() {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.05 }}>
      <svg width="1200" height="1400" viewBox="0 0 500 560" fill="none">
        <circle cx="250" cy="250" r="230" stroke="#c9a84c" strokeWidth="2" />
        <circle cx="250" cy="250" r="215" stroke="#c9a84c" strokeWidth="0.8" />
        <circle cx="250" cy="250" r="205" stroke="#c9a84c" strokeWidth="0.5" />
        <g fontFamily="serif" fontSize="14" fill="#c9a84c" opacity="0.6" textAnchor="middle">
          <text x="250" y="28">ᚠ</text><text x="310" y="34">ᚢ</text><text x="363" y="54">ᚦ</text>
          <text x="405" y="88">ᚨ</text><text x="434" y="132">ᚱ</text><text x="448" y="183">ᚲ</text>
          <text x="448" y="238">ᚷ</text><text x="434" y="290">ᚹ</text><text x="405" y="338">ᚺ</text>
          <text x="363" y="375">ᚾ</text><text x="310" y="400">ᛁ</text><text x="250" y="410">ᛃ</text>
          <text x="190" y="400">ᛇ</text><text x="137" y="375">ᛈ</text><text x="95" y="338">ᛉ</text>
          <text x="66" y="290">ᛊ</text><text x="52" y="238">ᛏ</text><text x="52" y="183">ᛒ</text>
          <text x="66" y="132">ᛖ</text><text x="95" y="88">ᛗ</text><text x="137" y="54">ᛚ</text>
          <text x="190" y="34">ᛞ</text>
        </g>
        <ellipse cx="250" cy="120" rx="130" ry="75" fill="#c9a84c"/>
        <ellipse cx="170" cy="148" rx="80" ry="55" fill="#c9a84c"/>
        <ellipse cx="330" cy="148" rx="80" ry="55" fill="#c9a84c"/>
        <ellipse cx="140" cy="185" rx="55" ry="40" fill="#c9a84c"/>
        <ellipse cx="360" cy="185" rx="55" ry="40" fill="#c9a84c"/>
        <ellipse cx="250" cy="95" rx="65" ry="35" fill="#c9a84c"/>
        <ellipse cx="200" cy="165" rx="50" ry="35" fill="#c9a84c"/>
        <ellipse cx="300" cy="165" rx="50" ry="35" fill="#c9a84c"/>
        <ellipse cx="120" cy="210" rx="35" ry="25" fill="#c9a84c"/>
        <ellipse cx="380" cy="210" rx="35" ry="25" fill="#c9a84c"/>
        <path d="M228 220Q225 270 223 320Q221 360 219 400L281 400Q279 360 277 320Q275 270 272 220Z" fill="#c9a84c"/>
        <path d="M219 395Q185 415 140 445Q105 465 75 478L80 486Q125 460 165 435Q200 418 224 405Z" fill="#c9a84c"/>
        <path d="M281 395Q315 415 360 445Q395 465 425 478L420 486Q375 460 335 435Q300 418 276 405Z" fill="#c9a84c"/>
        <path d="M236 400Q238 428 241 465L259 465Q262 428 264 400Z" fill="#c9a84c"/>
        <path d="M225 400Q200 418 170 440Q148 455 130 465" stroke="#c9a84c" strokeWidth="3" fill="none" opacity="0.7"/>
        <path d="M275 400Q300 418 330 440Q352 455 370 465" stroke="#c9a84c" strokeWidth="3" fill="none" opacity="0.7"/>
      </svg>
    </div>
  );
}

function RuneParticles() {
  const runes = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᛃ','ᛇ','ᛈ','ᛉ','ᛊ','ᛏ','ᛒ','ᛖ','ᛗ','ᛚ','ᛜ','ᛞ','ᛟ'];
  const [particles, setParticles] = useState<Array<{id:number;rune:string;x:number;y:number;size:number;dur:number;delay:number}>>([]);
  useEffect(() => {
    setParticles(Array.from({ length: 24 }, (_, i) => ({
      id: i, rune: runes[Math.floor(Math.random() * runes.length)],
      x: 3 + Math.random() * 94, y: 15 + Math.random() * 75,
      size: 16 + Math.random() * 22, dur: 8 + Math.random() * 14, delay: Math.random() * 12,
    })));
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div key={p.id} className="absolute" style={{
          left: `${p.x}%`, top: `${p.y}%`, fontSize: `${p.size}px`,
          color: '#c9a84c', opacity: 0, fontFamily: "'Cinzel', serif",
          animation: `runeFloat ${p.dur}s ease-in-out infinite`, animationDelay: `${p.delay}s`,
        }}>{p.rune}</div>
      ))}
    </div>
  );
}

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
    if (result.success) { router.push('/dashboard'); }
    else { setError(result.error || 'Login failed'); setIsLoading(false); }
  };

  return (
    <div className="grain-overlay min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(30,25,15,1) 0%, rgba(10,12,16,1) 60%, #000 100%)' }} />
      <YggdrasilBg />
      <RuneParticles />
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)' }} />
      <div className="fixed pointer-events-none" style={{ top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8" style={{ animation: 'fadeInDown 1s ease forwards' }}>
          <VegvisirSymbol />
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(32px, 7vw, 48px)', fontWeight: 700, letterSpacing: '6px', color: '#c9a84c', textShadow: '0 0 40px rgba(201,168,76,0.25)', lineHeight: 1, marginBottom: 4 }}>
            VANAHEIM
          </h1>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: 4, color: 'rgba(201,168,76,0.5)', marginBottom: 6 }}>Willson Family Command Center</p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px flex-1 max-w-20" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4))' }} />
            <span style={{ fontSize: 16, letterSpacing: 8, color: 'rgba(201,168,76,0.45)', fontFamily: "'Cinzel', serif" }}>ᚺ ᛟ ᛗ ᛖ</span>
            <div className="h-px flex-1 max-w-20" style={{ background: 'linear-gradient(270deg, transparent, rgba(201,168,76,0.4))' }} />
          </div>
        </div>

        <div className="rounded-2xl p-8" style={{ background: 'rgba(12, 14, 20, 0.85)', border: '1px solid rgba(201, 168, 76, 0.12)', backdropFilter: 'blur(24px)', boxShadow: '0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(201,168,76,0.05)', animation: 'slideUp 0.8s ease forwards', animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="mb-7">
            <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(138,109,43,0.7)', textAlign: 'center', marginBottom: 14, fontFamily: "'Cinzel', serif" }}>Choose your sigil</p>
            <div className="grid grid-cols-4 gap-3">
              {FAMILY_QUICK_LOGIN.map((member) => {
                const IconComponent = iconMap[member.icon];
                const isActive = selectedMember === member.name;
                return (
                  <button key={member.name} onClick={() => handleQuickSelect(member)}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-300"
                    style={{ background: isActive ? 'rgba(201, 168, 76, 0.08)' : 'rgba(20, 22, 30, 0.6)', border: isActive ? '1px solid rgba(201, 168, 76, 0.35)' : '1px solid rgba(107, 114, 128, 0.08)', boxShadow: isActive ? '0 0 20px rgba(201,168,76,0.08)' : 'none' }}>
                    <IconComponent active={isActive} />
                    <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, color: isActive ? '#c9a84c' : '#d1c7b7', fontFamily: "'Cinzel', serif" }}>{member.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

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
              <label style={{ display: 'block', fontSize: 10, letterSpacing: 3, color: 'rgba(138,109,43,0.6)', marginBottom: 8, textTransform: 'uppercase', fontFamily: "'Cinzel', serif" }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@thewillsons.com" required autoComplete="email" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: 3, color: 'rgba(138,109,43,0.6)', marginBottom: 8, textTransform: 'uppercase', fontFamily: "'Cinzel', serif" }}>Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'rgba(138,109,43,0.4)' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && (<div style={{ fontSize: 13, textAlign: 'center', padding: '10px 16px', borderRadius: 10, background: 'rgba(139, 37, 0, 0.12)', color: '#f87171', border: '1px solid rgba(139, 37, 0, 0.25)' }}>{error}</div>)}
            <button type="submit" disabled={isLoading || !email || !password}
              className="w-full py-4 rounded-xl font-semibold text-sm uppercase transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #8a6d2b 0%, #c9a84c 50%, #8a6d2b 100%)', color: '#0a0c10', boxShadow: '0 4px 24px rgba(201, 168, 76, 0.15), inset 0 1px 0 rgba(232,212,139,0.3)', fontFamily: "'Cinzel', serif", letterSpacing: 4 }}>
              {isLoading ? (<div className="w-5 h-5 border-2 border-void/30 border-t-void rounded-full animate-spin" />) : (<>Enter the Realm<ChevronRight size={16} /></>)}
            </button>
          </form>
        </div>

        <div className="text-center mt-8" style={{ fontSize: 14, letterSpacing: 8, color: 'rgba(201,168,76,0.12)' }}>ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ</div>
      </div>

      <style>{`
        @keyframes runeFloat { 0% { opacity: 0; transform: translateY(0) scale(0.7); } 12% { opacity: 0.12; } 88% { opacity: 0.05; } 100% { opacity: 0; transform: translateY(-100px) scale(1); } }
        @keyframes fadeInDown { 0% { opacity: 0; transform: translateY(-20px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
