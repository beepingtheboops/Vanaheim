'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Shield,
  LogOut,
  Camera,
  Lock,
  Wifi,
  Thermometer,
  Droplets,
  Bot,
  Sun,
  Calendar,
  Bell,
  Settings,
} from 'lucide-react';

const QUICK_STATS = [
  { label: 'Locks Secured', value: '3/3', icon: Lock, color: '#22c55e' },
  { label: 'Cameras Online', value: '3/4', icon: Camera, color: '#38bdf8' },
  { label: 'Temperature', value: '72°F', icon: Thermometer, color: '#c9a84c' },
  { label: 'Devices Active', value: '8', icon: Wifi, color: '#a855f7' },
];

const NAV_ITEMS = [
  { label: 'Security', icon: Shield, active: true },
  { label: 'Cameras', icon: Camera },
  { label: 'Devices', icon: Bot },
  { label: 'Climate', icon: Thermometer },
  { label: 'Sprinklers', icon: Droplets },
  { label: 'Lights', icon: Sun },
  { label: 'Calendar', icon: Calendar },
  { label: 'Settings', icon: Settings },
];

const ACTIVITY = [
  { text: 'Front door unlocked by Mom', time: '3:42 PM', color: '#a855f7' },
  { text: 'Motion detected — front porch camera', time: '3:40 PM', color: '#fbbf24' },
  { text: 'Roborock S8 completed cleaning cycle', time: '2:15 PM', color: '#22c55e' },
  { text: 'Front lawn sprinkler schedule ran', time: '6:00 AM', color: '#38bdf8' },
  { text: 'System armed — night mode', time: '10:00 PM', color: '#64748b' },
];

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="grain-overlay min-h-screen bg-void">
      {/* Top bar */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: 'rgba(10, 12, 16, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(201, 168, 76, 0.08)',
        }}
      >
        <div className="flex items-center gap-4">
          <Shield className="w-5 h-5 text-gold" strokeWidth={1.5} />
          <span className="font-display text-lg tracking-wider text-gold">
            HomeBase
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-400 font-medium">
            ● Connected
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-lg hover:bg-smoke/50 transition-colors">
            <Bell size={18} className="text-bone/50" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blood rounded-full" />
          </button>
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-smoke/40">
            <span className="text-xl">{user.avatar}</span>
            <div>
              <p className="text-sm font-medium text-bone">{user.name}</p>
              <p className="text-xs text-gold-dark/60">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-smoke/50 transition-colors text-bone/40 hover:text-bone"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav
          className="w-64 min-h-[calc(100vh-65px)] p-4 hidden lg:block"
          style={{
            background: 'rgba(19, 22, 29, 0.5)',
            borderRight: '1px solid rgba(201, 168, 76, 0.05)',
          }}
        >
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: item.active
                    ? 'rgba(201, 168, 76, 0.08)'
                    : 'transparent',
                  color: item.active ? 'var(--gold)' : 'rgba(209, 199, 183, 0.5)',
                  border: item.active
                    ? '1px solid rgba(201, 168, 76, 0.15)'
                    : '1px solid transparent',
                }}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 max-w-6xl">
          {/* Greeting */}
          <div className="mb-8 animate-fade-in">
            <h2 className="text-2xl font-display tracking-wide text-bone mb-1">
              Welcome home, {user.name}
            </h2>
            <p className="text-sm text-gold-dark/60">
              All systems operational — the realm is secure.
            </p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {QUICK_STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="rounded-xl p-5 animate-slide-up"
                style={{
                  background: 'rgba(19, 22, 29, 0.7)',
                  border: '1px solid rgba(201, 168, 76, 0.08)',
                  animationDelay: `${i * 0.1}s`,
                  animationFillMode: 'backwards',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <stat.icon size={20} style={{ color: stat.color }} />
                  <span
                    className="text-2xl font-bold font-mono"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </span>
                </div>
                <p className="text-xs text-bone/40 tracking-wider uppercase">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Activity feed */}
          <div
            className="rounded-xl p-6 animate-slide-up"
            style={{
              background: 'rgba(19, 22, 29, 0.7)',
              border: '1px solid rgba(201, 168, 76, 0.08)',
              animationDelay: '0.4s',
              animationFillMode: 'backwards',
            }}
          >
            <h3 className="text-xs tracking-[0.2em] uppercase text-gold-dark mb-5">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {ACTIVITY.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 py-3 px-4 rounded-lg"
                  style={{ background: 'rgba(30, 34, 45, 0.4)' }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: item.color }}
                  />
                  <span className="text-sm text-bone/70 flex-1">{item.text}</span>
                  <span className="text-xs text-bone/30 flex-shrink-0 font-mono">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Placeholder for future feature panels */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              className="rounded-xl p-8 text-center"
              style={{
                background: 'rgba(19, 22, 29, 0.4)',
                border: '1px dashed rgba(201, 168, 76, 0.12)',
              }}
            >
              <Camera className="w-8 h-8 text-gold-dark/30 mx-auto mb-3" />
              <p className="text-sm text-gold-dark/40">Camera feeds — coming next</p>
            </div>
            <div
              className="rounded-xl p-8 text-center"
              style={{
                background: 'rgba(19, 22, 29, 0.4)',
                border: '1px dashed rgba(201, 168, 76, 0.12)',
              }}
            >
              <Bot className="w-8 h-8 text-gold-dark/30 mx-auto mb-3" />
              <p className="text-sm text-gold-dark/40">Device controls — coming next</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
