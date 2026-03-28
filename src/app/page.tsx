'use client';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';

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

      {/* Base dark background */}
      <div className="fixed inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 30%, rgba(20,16,8,1) 0%, rgba(10,12,16,1) 60%, #000 100%)'
      }} />

      {/* Yggdrasil image — gold tinted, faded */}
      <div
        className="fixed inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: 0.12 }}
      >
        <img
          src="/yggdrasil.png"
          alt=""
          style={{
            width: '70vmin',
            height: '70vmin',
            objectFit: 'contain',
            filter: 'invert(1) sepia(1) saturate(4) hue-rotate(5deg) brightness(0.85)',
          }}
        />
      </div>

      {/* Vignette overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.75) 100%)'
      }} />

      <RuneParticles />

      {/* Add to Home Screen button — top right */}
      <div className="fixed top-4 right-4 z-50" style={{ animation: 'fadeInDown 1s ease forwards' }}>
        <button
          onClick={() => {
            alert('To install: tap the Share button (iOS) or menu (Android) and select "Add to Home Screen"');
          }}
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

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md text-center">
        <div style={{ animation: 'fadeInDown 1s ease forwards' }}>
          <VegvisirSymbol />

          {/* Welcome to */}
          <p style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 13,
            letterSpacing: 6,
            color: 'rgba(201,168,76,0.5)',
            marginBottom: 6,
            textTransform: 'uppercase',
          }}>Welcome to</p>

          {/* VANAHEIM */}
          <h1 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(36px, 8vw, 56px)',
            fontWeight: 700,
            letterSpacing: '8px',
            color: '#c9a84c',
            textShadow: '0 0 40px rgba(201,168,76,0.3), 0 0 80px rgba(201,168,76,0.1)',
            lineHeight: 1,
            marginBottom: 10,
          }}>VANAHEIM</h1>

          {/* Subtitle */}
          <p style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 16,
            letterSpacing: 3,
            color: 'rgba(201,168,76,0.55)',
            marginBottom: 6,
          }}>Willson Family Command Center</p>

          {/* Rune divider */}
          <div className="flex items-center justify-center gap-3 mt-4 mb-12">
            <div className="h-px flex-1 max-w-20" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4))' }} />
            <span style={{ fontSize: 16, letterSpacing: 8, color: 'rgba(201,168,76,0.45)', fontFamily: "'Cinzel', serif" }}>ᚺ ᛟ ᛗ ᛖ</span>
            <div className="h-px flex-1 max-w-20" style={{ background: 'linear-gradient(270deg, transparent, rgba(201,168,76,0.4))' }} />
          </div>
        </div>

        {/* Enter the Realm button */}
        <div style={{ animation: 'slideUp 0.8s ease forwards', animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-4 rounded-xl font-semibold text-sm uppercase transition-all duration-300 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #8a6d2b 0%, #c9a84c 50%, #8a6d2b 100%)',
              color: '#0a0c10',
              boxShadow: '0 4px 24px rgba(201, 168, 76, 0.2), inset 0 1px 0 rgba(232,212,139,0.3)',
              fontFamily: "'Cinzel', serif",
              letterSpacing: 4,
            }}
          >
            Enter the Realm <ChevronRight size={16} />
          </button>
        </div>

        <div className="text-center mt-8" style={{ fontSize: 14, letterSpacing: 8, color: 'rgba(201,168,76,0.1)' }}>
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
