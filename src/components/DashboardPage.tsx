'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  Shield, LogOut, Camera, Lock, Wifi, Thermometer,
  Droplets, Bot, Sun, Calendar, Bell, Settings,
  RefreshCw, Battery, AlertTriangle, Home,
} from 'lucide-react';

// ─── Config ─────────────────────────────────────────────────────────────────
const HA_WORKER = 'https://super-rain-384e.mattwillson.workers.dev';
const REFRESH_INTERVAL = 30_000;

// ─── Entity IDs — update as you add devices to HA ───────────────────────────
// To find entity IDs: HA → Settings → Devices & Services → Entities tab
const ENTITIES = {
  // August smart lock
  locks: ['lock.front_door'],

  // Lock battery
  lockBattery: 'sensor.front_door_battery',

  // Cameras — add entity IDs as you connect cameras
  cameras: [] as string[],

  // Climate — update when you add a thermostat (Nest, Ecobee, etc.)
  climate: '',

  // Lights — add entity IDs as you add smart lights
  lights: [] as string[],

  // Alarm — update when you add a security panel
  alarm: '',

  // Weather from Met.no (auto-discovered)
  weather: 'weather.forecast_home',
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface HaState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

interface StatCard {
  label: string;
  value: string;
  subvalue?: string;
  icon: React.ElementType;
  color: string;
  status: 'good' | 'warn' | 'error' | 'neutral';
}

interface ActivityItem {
  text: string;
  time: string;
  color: string;
  entity_id: string;
}

// ─── Nav ─────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Overview', icon: Home },
  { label: 'Security', icon: Shield },
  { label: 'Cameras', icon: Camera },
  { label: 'Devices', icon: Bot },
  { label: 'Climate', icon: Thermometer },
  { label: 'Sprinklers', icon: Droplets },
  { label: 'Lights', icon: Sun },
  { label: 'Calendar', icon: Calendar },
  { label: 'Settings', icon: Settings },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function capitalize(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function buildStats(states: HaState[]): StatCard[] {
  const sm = Object.fromEntries(states.map(s => [s.entity_id, s]));
  const cards: StatCard[] = [];

  // ── Locks ──────────────────────────────────────────────
  const lockStates = ENTITIES.locks.map(id => sm[id]).filter(Boolean);
  if (lockStates.length > 0) {
    const lockedCount = lockStates.filter(s => s.state === 'locked').length;
    const allLocked = lockedCount === lockStates.length;
    const battery = sm[ENTITIES.lockBattery];
    const batteryLevel = battery ? `${battery.state}% battery` : undefined;
    cards.push({
      label: 'Locks',
      value: allLocked ? 'Secured' : `${lockedCount}/${lockStates.length}`,
      subvalue: batteryLevel,
      icon: Lock,
      color: allLocked ? '#22c55e' : '#ef4444',
      status: allLocked ? 'good' : 'error',
    });
  } else {
    cards.push({ label: 'Locks', value: '—', icon: Lock, color: '#64748b', status: 'neutral' });
  }

  // ── Cameras ───────────────────────────────────────────
  const cameraStates = ENTITIES.cameras.map(id => sm[id]).filter(Boolean);
  if (cameraStates.length > 0) {
    const onlineCount = cameraStates.filter(s => s.state !== 'unavailable').length;
    const allOnline = onlineCount === cameraStates.length;
    cards.push({
      label: 'Cameras',
      value: `${onlineCount}/${cameraStates.length}`,
      subvalue: allOnline ? 'All online' : `${cameraStates.length - onlineCount} offline`,
      icon: Camera,
      color: allOnline ? '#38bdf8' : '#f59e0b',
      status: allOnline ? 'good' : 'warn',
    });
  } else {
    cards.push({ label: 'Cameras', value: '—', icon: Camera, color: '#64748b', status: 'neutral' });
  }

  // ── Weather ───────────────────────────────────────────
  const weather = sm[ENTITIES.weather];
  if (weather) {
    const temp = weather.attributes.temperature as number | undefined;
    cards.push({
      label: 'Weather',
      value: temp !== undefined ? `${Math.round(temp)}°F` : '—',
      subvalue: capitalize(weather.state),
      icon: Thermometer,
      color: '#c9a84c',
      status: 'neutral',
    });
  } else {
    cards.push({ label: 'Weather', value: '—', icon: Thermometer, color: '#64748b', status: 'neutral' });
  }

  // ── Lights ────────────────────────────────────────────
  const lightStates = ENTITIES.lights.map(id => sm[id]).filter(Boolean);
  if (lightStates.length > 0) {
    const lightsOn = lightStates.filter(s => s.state === 'on').length;
    cards.push({
      label: 'Lights',
      value: lightsOn === 0 ? 'All off' : `${lightsOn} on`,
      subvalue: `of ${lightStates.length} total`,
      icon: Sun,
      color: lightsOn > 0 ? '#fbbf24' : '#64748b',
      status: lightsOn > 0 ? 'warn' : 'good',
    });
  } else {
    cards.push({ label: 'Lights', value: '—', icon: Sun, color: '#64748b', status: 'neutral' });
  }

  // ── Alarm ────────────────────────────────────────────
  const alarm = sm[ENTITIES.alarm];
  if (alarm) {
    const isArmed = alarm.state.startsWith('armed');
    const isTriggered = alarm.state === 'triggered';
    cards.push({
      label: 'Alarm',
      value: capitalize(alarm.state),
      icon: isTriggered ? AlertTriangle : Shield,
      color: isTriggered ? '#ef4444' : isArmed ? '#22c55e' : '#64748b',
      status: isTriggered ? 'error' : isArmed ? 'good' : 'neutral',
    });
  } else {
    cards.push({ label: 'Alarm', value: '—', icon: Shield, color: '#64748b', status: 'neutral' });
  }

  // ── Lock Battery ─────────────────────────────────────
  const battery = sm[ENTITIES.lockBattery];
  if (battery) {
    const level = parseInt(battery.state);
    const isLow = level < 20;
    cards.push({
      label: 'Lock Battery',
      value: `${level}%`,
      subvalue: 'Front Door',
      icon: Battery,
      color: isLow ? '#ef4444' : level < 40 ? '#f59e0b' : '#22c55e',
      status: isLow ? 'error' : level < 40 ? 'warn' : 'good',
    });
  }

  // ── Active Entities ───────────────────────────────────
  const activeCount = states.filter(s =>
    s.state !== 'unavailable' &&
    s.state !== 'unknown' &&
    !s.entity_id.startsWith('sensor.sun') &&
    !s.entity_id.startsWith('update.')
  ).length;
  cards.push({
    label: 'Active Entities',
    value: `${activeCount}`,
    subvalue: 'in Home Assistant',
    icon: Wifi,
    color: '#a855f7',
    status: 'neutral',
  });

  return cards;
}

function buildActivity(states: HaState[]): ActivityItem[] {
  const relevant = states.filter(s => {
    const id = s.entity_id;
    return (
      ENTITIES.locks.includes(id) ||
      ENTITIES.cameras.includes(id) ||
      ENTITIES.lights.includes(id) ||
      id === ENTITIES.alarm ||
      id === ENTITIES.lockBattery
    );
  });

  const source = relevant.length > 0
    ? relevant
    : states.filter(s => !s.entity_id.startsWith('sensor.sun'));

  return source
    .sort((a, b) => new Date(b.last_changed).getTime() - new Date(a.last_changed).getTime())
    .slice(0, 8)
    .map(s => {
      const name = (s.attributes.friendly_name as string) || s.entity_id;
      const isLock = ENTITIES.locks.includes(s.entity_id);
      const isCamera = ENTITIES.cameras.includes(s.entity_id);
      const isLight = ENTITIES.lights.includes(s.entity_id);
      return {
        entity_id: s.entity_id,
        text: `${name} — ${capitalize(s.state)}`,
        time: formatTime(s.last_changed),
        color: isLock ? '#a855f7' : isCamera ? '#fbbf24' : isLight ? '#c9a84c' : '#64748b',
      };
    });
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<StatCard[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [haLoading, setHaLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [haError, setHaError] = useState(false);
  const [activeNav, setActiveNav] = useState('Overview');

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  const fetchHaStates = useCallback(async () => {
    try {
      const res = await fetch(`${HA_WORKER}/api/ha/states`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const states: HaState[] = await res.json();
      setStats(buildStats(states));
      setActivity(buildActivity(states));
      setLastUpdated(new Date());
      setHaError(false);
    } catch {
      setHaError(true);
    } finally {
      setHaLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHaStates();
    const interval = setInterval(fetchHaStates, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchHaStates]);

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

      {/* ── Top bar ──────────────────────────────────────────── */}
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
          <span className="font-display text-lg tracking-wider text-gold">Vanaheim</span>
          <span className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
            haError ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
          }`}>
            {haError ? '● Disconnected' : '● Connected'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {lastUpdated && (
            <button
              onClick={fetchHaStates}
              className="flex items-center gap-2 text-xs text-bone/30 hover:text-bone/60 transition-colors"
              title="Refresh now"
            >
              <RefreshCw size={12} />
              <span className="hidden sm:inline">
                {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </button>
          )}
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

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <nav
          className="w-64 min-h-[calc(100vh-65px)] p-4 hidden lg:block sticky top-[65px] self-start"
          style={{
            background: 'rgba(19, 22, 29, 0.5)',
            borderRight: '1px solid rgba(201, 168, 76, 0.05)',
          }}
        >
          <div className="space-y-1">
            {NAV_ITEMS.map(item => {
              const active = activeNav === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => setActiveNav(item.label)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: active ? 'rgba(201, 168, 76, 0.08)' : 'transparent',
                    color: active ? 'var(--gold)' : 'rgba(209, 199, 183, 0.5)',
                    border: active ? '1px solid rgba(201, 168, 76, 0.15)' : '1px solid transparent',
                  }}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Main content ─────────────────────────────────────── */}
        <main className="flex-1 p-6 lg:p-8 max-w-6xl">

          {/* Greeting */}
          <div className="mb-8 animate-fade-in">
            <h2 className="text-2xl font-display tracking-wide text-bone mb-1">
              Welcome home, {user.name}
            </h2>
            <p className="text-sm text-gold-dark/60">
              {haError
                ? 'Unable to reach Home Assistant — check your connection.'
                : 'All systems operational — the realm is secure.'}
            </p>
          </div>

          {/* ── Stat cards ────────────────────────────────────── */}
          {haLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl p-5 animate-pulse" style={{
                  background: 'rgba(19, 22, 29, 0.7)',
                  border: '1px solid rgba(201, 168, 76, 0.08)',
                  minHeight: 100,
                }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className="rounded-xl p-5 animate-slide-up"
                  style={{
                    background: 'rgba(19, 22, 29, 0.7)',
                    border: `1px solid ${
                      stat.status === 'error' ? 'rgba(239, 68, 68, 0.2)'
                      : stat.status === 'warn' ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(201, 168, 76, 0.08)'
                    }`,
                    animationDelay: `${i * 0.08}s`,
                    animationFillMode: 'backwards',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon size={18} style={{ color: stat.color }} />
                    <span className="text-xl font-bold font-mono" style={{ color: stat.color }}>
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-xs text-bone/40 tracking-wider uppercase mb-1">
                    {stat.label}
                  </p>
                  {stat.subvalue && (
                    <p className="text-xs text-bone/25 truncate">{stat.subvalue}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Activity + Front Door ─────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">

            {/* Activity feed */}
            <div
              className="lg:col-span-2 rounded-xl p-6 animate-slide-up"
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
              {haLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-lg animate-pulse"
                      style={{ background: 'rgba(30, 34, 45, 0.4)' }} />
                  ))}
                </div>
              ) : activity.length === 0 ? (
                <p className="text-sm text-bone/30 text-center py-6">No recent activity</p>
              ) : (
                <div className="space-y-2">
                  {activity.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 py-2.5 px-4 rounded-lg"
                      style={{ background: 'rgba(30, 34, 45, 0.4)' }}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: item.color }} />
                      <span className="text-sm text-bone/70 flex-1 truncate">{item.text}</span>
                      <span className="text-xs text-bone/30 flex-shrink-0 font-mono">{item.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Front Door card */}
            <div
              className="rounded-xl p-6 animate-slide-up flex flex-col"
              style={{
                background: 'rgba(19, 22, 29, 0.7)',
                border: '1px solid rgba(201, 168, 76, 0.08)',
                animationDelay: '0.45s',
                animationFillMode: 'backwards',
              }}
            >
              <h3 className="text-xs tracking-[0.2em] uppercase text-gold-dark mb-5">
                Front Door
              </h3>
              {haLoading ? (
                <div className="flex-1 rounded-lg animate-pulse"
                  style={{ background: 'rgba(30, 34, 45, 0.4)', minHeight: 80 }} />
              ) : (() => {
                const lockCard = stats.find(s => s.label === 'Locks');
                const batteryCard = stats.find(s => s.label === 'Lock Battery');
                const isLocked = lockCard?.value === 'Secured';
                return (
                  <div className="flex flex-col gap-4 flex-1">
                    <div className="flex items-center justify-between p-4 rounded-xl" style={{
                      background: isLocked ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      border: `1px solid ${isLocked ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    }}>
                      <div className="flex items-center gap-3">
                        <Lock size={20} style={{ color: isLocked ? '#22c55e' : '#ef4444' }} />
                        <span className="text-sm font-medium"
                          style={{ color: isLocked ? '#22c55e' : '#ef4444' }}>
                          {isLocked ? 'Locked' : 'Unlocked'}
                        </span>
                      </div>
                    </div>
                    {batteryCard && (
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs text-bone/40">Battery</span>
                        <div className="flex items-center gap-2">
                          <Battery size={12} style={{ color: batteryCard.color }} />
                          <span className="text-xs font-mono" style={{ color: batteryCard.color }}>
                            {batteryCard.value}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="mt-auto rounded-lg p-3 text-center" style={{
                      background: 'rgba(30, 34, 45, 0.4)',
                      border: '1px dashed rgba(201, 168, 76, 0.1)',
                    }}>
                      <p className="text-xs text-bone/25">Lock controls — coming next</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ── Placeholder panels ───────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl p-8 text-center animate-slide-up" style={{
              background: 'rgba(19, 22, 29, 0.4)',
              border: '1px dashed rgba(201, 168, 76, 0.12)',
              animationDelay: '0.5s',
              animationFillMode: 'backwards',
            }}>
              <Camera className="w-8 h-8 text-gold-dark/30 mx-auto mb-3" />
              <p className="text-sm text-gold-dark/40">Camera feeds — coming next</p>
            </div>
            <div className="rounded-xl p-8 text-center animate-slide-up" style={{
              background: 'rgba(19, 22, 29, 0.4)',
              border: '1px dashed rgba(201, 168, 76, 0.12)',
              animationDelay: '0.55s',
              animationFillMode: 'backwards',
            }}>
              <Bot className="w-8 h-8 text-gold-dark/30 mx-auto mb-3" />
              <p className="text-sm text-gold-dark/40">Device controls — coming next</p>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
