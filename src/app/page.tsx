'use client';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';

function YggdrasilBg() {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.05 }}>
      <svg width="1200" height="1400" viewBox="0 0 500 560" fill="none">
        <circle cx="250" cy="250" r="230" stroke="#c9a84c" strokeWidth="2" />
        <circle cx="250" cy="250" r="215" stroke="#c9a84c" strokeWidth="0.8" />
        <ellipse cx="250" cy="120" rx="130" ry="75" fill="#c9a84c"/>
        <ellipse cx="170" cy="148" rx="80" ry="55" fill="#c9a84c"/>
        <ellipse cx="330" cy="148" rx="80" ry="55" fill="#c9a84c"/>
        <path d="M228 220Q225 270 223 320Q221 360 219 400L281 400Q279 360 277 320Q275 270 272 220Z" fill="#c9a84c"/>
        <path d="M219 395Q185 415 140 445Q105 465 75 478L80 486Q125 460 165 435Q200 418 224 405Z" fill="#c9a84c"/>
        <path d="M281 395Q315 415 360 445Q395 465 425 478L420 486Q375 460 335 435Q300 418 276 405Z" fill="#c9a84c"/>
      </svg>
    </div>
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
    </svg>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="grain-overlay min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 30%, rgba(30,25,15,1) 0%, rgba(10,12,16,1) 60%, #000 100%)'
      }} />
      <YggdrasilBg />
      <RuneParticles />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)'
      }} />

      <div className="relative z-10 w-full max-w-md text-center">
        <div style={{ animation: 'fadeInDown 1s ease forwards' }}>
          <VegvisirSymbol />
          <h1 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(32px, 7vw, 48px)',
            fontWeight: 700,
            letterSpacing: '6px',
            color: '#c9a84c',
            textShadow: '0 0 40px rgba(201,168,76,0.25)',
            lineHeight: 1,
            marginBottom: 4
          }}>VANAHEIM</h1>
          <p style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 12,
            letterSpacing: 4,
            color: 'rgba(201,168,76,0.5)',
            marginBottom: 6
          }}>Willson Family Command Center</p>
          <div className="flex items-center justify-center gap-3 mt-3 mb-12">
            <div className="h-px flex-1 max-w-20" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4))' }} />
            <span style={{ fontSize: 16, letterSpacing: 8, color: 'rgba(201,168,76,0.45)', fontFamily: "'Cinzel', serif" }}>ᚺ ᛟ ᛗ ᛖ</span>
            <div className="h-px flex-1 max-w-20" style={{ background: 'linear-gradient(270deg, transparent, rgba(201,168,76,0.4))' }} />
          </div>
        </div>

        <div style={{ animation: 'slideUp 0.8s ease forwards', animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-4 rounded-xl font-semibold text-sm uppercase transition-all duration-300 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #8a6d2b 0%, #c9a84c 50%, #8a6d2b 100%)',
              color: '#0a0c10',
              boxShadow: '0 4px 24px rgba(201, 168, 76, 0.15), inset 0 1px 0 rgba(232,212,139,0.3)',
              fontFamily: "'Cinzel', serif",
              letterSpacing: 4
            }}
          >
            Enter the Realm <ChevronRight size={16} />
          </button>
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
