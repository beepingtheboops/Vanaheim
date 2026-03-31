'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  Shield, LogOut, Camera, Lock, Wifi, Thermometer,
  Droplets, Bot, Sun, Calendar, Bell, Settings,
  RefreshCw, Battery, Home, Unlock,
  MapPin, Sunrise, Sunset, Printer, ShoppingCart,
  Cloud, Wind, Droplet, Menu, X,
} from 'lucide-react';

const REFRESH_INTERVAL = 30_000;

const ENTITIES = {
  locks: ['lock.front_door'],
  lockBattery: 'sensor.front_door_battery',
  lockOperator: 'sensor.front_door_operator',
  cameras: [] as string[],
  climate: '',
  lights: [] as string[],
  alarm: '',
  weather: 'weather.forecast_home',
  person: 'person.matt',
  wanStatus: 'binary_sensor.eero_wan_status',
  externalIp: 'sensor.eero_external_ip',
  sun: 'sun.sun',
  printerBlack: 'sensor.hp_color_laserjet_pro_m252dw_black_cartridge_hp_cf400a',
  printerCyan: 'sensor.hp_color_laserjet_pro_m252dw_cyan_cartridge_hp_cf401x',
  printerMagenta: 'sensor.hp_color_laserjet_pro_m252dw_magenta_cartridge_hp_cf403a',
  printerYellow: 'sensor.hp_color_laserjet_pro_m252dw_yellow_cartridge_hp_cf402a',
};

interface HaState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
}

interface TodoItem {
  uid: string;
  summary: string;
  status: string;
}

const NAV_ITEMS = [
  { label: 'Overview', icon: Home, href: null },
  { label: 'Security', icon: Shield, href: null },
  { label: 'Cameras', icon: Camera, href: null },
  { label: 'Devices', icon: Bot, href: null },
  { label: 'Climate', icon: Thermometer, href: null },
  { label: 'Sprinklers', icon: Droplets, href: null },
  { label: 'Lights', icon: Sun, href: null },
  { label: 'Calendar', icon: Calendar, href: null },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

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

function formatTimeOfDay(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });
}

function capitalize(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function inkColor(level: number): string {
  if (level < 10) return '#ef4444';
  if (level < 25) return '#f59e0b';
  return '#22c55e';
}

function Card({ children, className = '', delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={`rounded-xl p-5 animate-slide-up ${className}`}
      style={{
        background: 'rgba(19, 22, 29, 0.7)',
        border: '1px solid rgba(201, 168, 76, 0.08)',
        animationDelay: `${delay}s`,
        animationFillMode: 'backwards',
      }}
    >
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs tracking-[0.2em] uppercase text-gold-dark mb-4">
      {children}
    </h3>
  );
}

function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="rounded-xl p-5 animate-pulse"
      style={{
        background: 'rgba(19, 22, 29, 0.7)',
        border: '1px solid rgba(201, 168, 76, 0.08)',
        animationDelay: `${delay}s`,
        minHeight: 120,
      }}
    />
  );
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [states, setStates] = useState<Record<string, HaState>>({});
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [haLoading, setHaLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [haError, setHaError] = useState(false);
  const [activeNav, setActiveNav] = useState('Overview');
  const [lockLoading, setLockLoading] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  const fetchStates = useCallback(async () => {
    try {
      const res = await fetch('/api/ha/states');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: HaState[] = await res.json();
      const map = Object.fromEntries(data.map(s => [s.entity_id, s]));
      setStates(map);
      setLastUpdated(new Date());
      setHaError(false);
    } catch {
      setHaError(true);
    } finally {
      setHaLoading(false);
    }
  }, []);

  const fetchTodos = useCallback(async () => {
    try {
      const res2 = await fetch('/api/ha/states/todo.shopping_list');
      if (res2.ok) {
        const data = await res2.json();
        const items = (data.attributes?.items as TodoItem[]) || [];
        setTodos(items);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchStates();
    fetchTodos();
    const interval = setInterval(() => {
      fetchStates();
      fetchTodos();
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStates, fetchTodos]);

  const callService = useCallback(async (domain: string, service: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/ha/services/${domain}/${service}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Service call failed: ${res.status}`);
    return res.json();
  }, []);

  const toggleLock = useCallback(async () => {
    const lock = states[ENTITIES.locks[0]];
    if (!lock || lockLoading) return;
    setLockLoading(true);
    setStates(prev => ({
      ...prev,
      [ENTITIES.locks[0]]: {
        ...prev[ENTITIES.locks[0]],
        state: lock.state === 'locked' ? 'unlocked' : 'locked',
      }
    }));
    try {
      const service = lock.state === 'locked' ? 'unlock' : 'lock';
      await callService('lock', service, { entity_id: ENTITIES.locks[0] });
      setTimeout(fetchStates, 2000);
    } catch {
      setStates(prev => ({ ...prev, [ENTITIES.locks[0]]: lock }));
    } finally {
      setLockLoading(false);
    }
  }, [states, lockLoading, callService, fetchStates]);

  const addTodo = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    try {
      await callService('todo', 'add_item', {
        entity_id: 'todo.shopping_list',
        item: newTodo.trim(),
      });
      setNewTodo('');
      setTimeout(fetchTodos, 500);
    } catch {
      // silently fail
    }
  }, [newTodo, callService, fetchTodos]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const lock = states[ENTITIES.locks[0]];
  const battery = states[ENTITIES.lockBattery];
  const operator = states[ENTITIES.lockOperator];
  const weather = states[ENTITIES.weather];
  const person = states[ENTITIES.person];
  const wan = states[ENTITIES.wanStatus];
  const externalIp = states[ENTITIES.externalIp];
  const sun = states[ENTITIES.sun];
  const printerBlack = states[ENTITIES.printerBlack];
  const printerCyan = states[ENTITIES.printerCyan];
  const printerMagenta = states[ENTITIES.printerMagenta];
  const printerYellow = states[ENTITIES.printerYellow];

  const isLocked = lock?.state === 'locked';
  const batteryLevel = battery ? parseInt(battery.state) : null;
  const isHome = person?.state === 'home';
  const isOnline = wan?.state === 'on';
  const sunriseTime = sun?.attributes?.next_rising as string;
  const sunsetTime = sun?.attributes?.next_setting as string;
  const isBelowHorizon = sun?.state === 'below_horizon';

  const weatherTemp = weather?.attributes?.temperature as number | undefined;
  const weatherCondition = weather?.state || '';
  const weatherHumidity = weather?.attributes?.humidity as number | undefined;
  const weatherWind = weather?.attributes?.wind_speed as number | undefined;
  const weatherForecast = weather?.attributes?.forecast as Array<{
    datetime: string;
    temperature: number;
    templow: number;
    condition: string;
  }> | undefined;

  const inkLevels = [
    { label: 'Black', level: printerBlack ? parseInt(printerBlack.state) : null, color: '#94a3b8' },
    { label: 'Cyan', level: printerCyan ? parseInt(printerCyan.state) : null, color: '#38bdf8' },
    { label: 'Magenta', level: printerMagenta ? parseInt(printerMagenta.state) : null, color: '#f472b6' },
    { label: 'Yellow', level: printerYellow ? parseInt(printerYellow.state) : null, color: '#fbbf24' },
  ];

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
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-smoke/50 transition-colors lg:hidden"
          >
            <Menu size={20} className="text-bone/70" />
          </button>
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
              onClick={() => { fetchStates(); fetchTodos(); }}
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
          </button>
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-smoke/40">
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

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Slide-in menu */}
          <nav
            className="fixed top-0 left-0 bottom-0 w-72 z-50 p-6 lg:hidden"
            style={{
              background: 'rgba(10, 12, 16, 0.98)',
              borderRight: '1px solid rgba(201, 168, 76, 0.15)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gold" strokeWidth={1.5} />
                <span className="font-display text-lg tracking-wider text-gold">Menu</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-smoke/50 transition-colors"
              >
                <X size={20} className="text-bone/70" />
              </button>
            </div>
            <div className="space-y-1">
              {NAV_ITEMS.map(item => {
                const active = activeNav === item.label;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.href) {
                        router.push(item.href);
                      } else {
                        setActiveNav(item.label);
                      }
                      setMobileMenuOpen(false);
                    }}
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
        </>
      )}

      <div className="flex">

        {/* Sidebar */}
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
                  onClick={() => {
                    if (item.href) {
                      router.push(item.href);
                    } else {
                      setActiveNav(item.label);
                    }
                  }}
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

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 max-w-6xl">

          <div className="mb-6 animate-fade-in">
            <h2 className="text-2xl font-display tracking-wide text-bone mb-1">
              Welcome home, {user.name}
            </h2>
            <p className="text-sm text-gold-dark/60">
              {haError
                ? 'Unable to reach Home Assistant — check your connection.'
                : `${isBelowHorizon ? 'Good evening' : 'Good day'} — the realm is secure.`}
            </p>
          </div>

          {/* Row 1: Front Door + Presence + Network */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

            {haLoading ? <SkeletonCard delay={0} /> : (
              <Card delay={0}>
                <CardTitle>Front Door</CardTitle>
                <div className="space-y-3">
                  <div
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{
                      background: isLocked ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${isLocked ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {isLocked
                        ? <Lock size={20} style={{ color: '#22c55e' }} />
                        : <Unlock size={20} style={{ color: '#ef4444' }} />
                      }
                      <div>
                        <p className="text-sm font-medium" style={{ color: isLocked ? '#22c55e' : '#ef4444' }}>
                          {lock ? capitalize(lock.state) : '—'}
                        </p>
                        {operator && operator.state !== 'unknown' && (
                          <p className="text-xs text-bone/30">{capitalize(operator.state)}</p>
                        )}
                      </div>
                    </div>
                    {lock && (
                      <button
                        onClick={toggleLock}
                        disabled={lockLoading}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                        style={{
                          background: isLocked ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                          color: isLocked ? '#ef4444' : '#22c55e',
                          border: `1px solid ${isLocked ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                        }}
                      >
                        {lockLoading ? '...' : isLocked ? 'Unlock' : 'Lock'}
                      </button>
                    )}
                  </div>

                  {batteryLevel !== null && (
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <Battery size={14} style={{ color: inkColor(batteryLevel) }} />
                        <span className="text-xs text-bone/40">Battery</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1 mx-3">
                        <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(30,34,45,0.8)' }}>
                          <div
                            className="h-1 rounded-full transition-all"
                            style={{ width: `${batteryLevel}%`, background: inkColor(batteryLevel) }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-mono" style={{ color: inkColor(batteryLevel) }}>
                        {batteryLevel}%
                      </span>
                    </div>
                  )}

                  {lock && (
                    <p className="text-xs text-bone/25 text-right">
                      {formatTime(lock.last_changed)}
                    </p>
                  )}
                </div>
              </Card>
            )}

            {haLoading ? <SkeletonCard delay={0.08} /> : (
              <Card delay={0.08}>
                <CardTitle>Presence</CardTitle>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'rgba(30,34,45,0.4)' }}>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium text-bone">{user.name}</p>
                        <p className="text-xs" style={{ color: isHome ? '#22c55e' : '#64748b' }}>
                          {person ? capitalize(person.state) : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full" style={{ background: isHome ? '#22c55e' : '#64748b' }} />
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <MapPin size={14} className="text-bone/30" />
                    <span className="text-xs text-bone/30">
                      {isHome ? 'At home' : 'Away from home'}
                    </span>
                  </div>
                  <p className="text-xs text-bone/20 px-1">
                    Add family members in HA to track everyone
                  </p>
                </div>
              </Card>
            )}

            {haLoading ? <SkeletonCard delay={0.16} /> : (
              <Card delay={0.16}>
                <CardTitle>Network</CardTitle>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'rgba(30,34,45,0.4)' }}>
                    <div className="flex items-center gap-3">
                      <Wifi size={18} style={{ color: isOnline ? '#22c55e' : '#ef4444' }} />
                      <div>
                        <p className="text-sm font-medium text-bone">Internet</p>
                        <p className="text-xs" style={{ color: isOnline ? '#22c55e' : '#ef4444' }}>
                          {wan ? (isOnline ? 'Online' : 'Offline') : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full" style={{ background: isOnline ? '#22c55e' : '#ef4444' }} />
                  </div>
                  {externalIp && (
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs text-bone/40">External IP</span>
                      <span className="text-xs font-mono text-bone/50">{externalIp.state}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs text-bone/40">Provider</span>
                    <span className="text-xs text-bone/50">Eero</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Row 2: Weather + Daylight */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

            {haLoading ? <SkeletonCard delay={0.24} /> : (
              <Card delay={0.24}>
                <CardTitle>Weather</CardTitle>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-4xl font-bold font-mono text-bone">
                        {weatherTemp !== undefined ? `${Math.round(weatherTemp)}°F` : '—'}
                      </p>
                      <p className="text-sm text-bone/50 mt-1">{capitalize(weatherCondition)}</p>
                    </div>
                    <div className="space-y-2 text-right">
                      {weatherHumidity !== undefined && (
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-bone/40">Humidity</span>
                          <div className="flex items-center gap-1">
                            <Droplet size={12} className="text-blue-400" />
                            <span className="text-xs font-mono text-bone/60">{weatherHumidity}%</span>
                          </div>
                        </div>
                      )}
                      {weatherWind !== undefined && (
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-bone/40">Wind</span>
                          <div className="flex items-center gap-1">
                            <Wind size={12} className="text-bone/40" />
                            <span className="text-xs font-mono text-bone/60">{weatherWind} mph</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {weatherForecast && weatherForecast.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gold/5">
                      {weatherForecast.slice(0, 4).map((day, i) => (
                        <div key={i} className="text-center">
                          <p className="text-xs text-bone/30 mb-1">
                            {new Date(day.datetime).toLocaleDateString('en-US', { weekday: 'short' })}
                          </p>
                          <Cloud size={14} className="text-bone/30 mx-auto mb-1" />
                          <p className="text-xs font-mono text-bone/60">{Math.round(day.temperature)}°</p>
                          {day.templow !== undefined && (
                            <p className="text-xs font-mono text-bone/30">{Math.round(day.templow)}°</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {haLoading ? <SkeletonCard delay={0.32} /> : (
              <Card delay={0.32}>
                <CardTitle>Daylight</CardTitle>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className="px-4 py-2 rounded-full text-xs font-medium"
                      style={{
                        background: isBelowHorizon ? 'rgba(100,116,139,0.15)' : 'rgba(251,191,36,0.1)',
                        color: isBelowHorizon ? '#64748b' : '#fbbf24',
                        border: `1px solid ${isBelowHorizon ? 'rgba(100,116,139,0.2)' : 'rgba(251,191,36,0.2)'}`,
                      }}
                    >
                      {isBelowHorizon ? '🌙 Night' : '☀️ Day'}
                    </div>
                    <p className="text-xs text-bone/30">Huntington Beach, CA</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(30,34,45,0.4)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Sunrise size={14} style={{ color: '#fbbf24' }} />
                        <span className="text-xs text-bone/40">Sunrise</span>
                      </div>
                      <p className="text-sm font-mono text-bone/70">
                        {sunriseTime ? formatTimeOfDay(sunriseTime) : '—'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(30,34,45,0.4)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Sunset size={14} style={{ color: '#f97316' }} />
                        <span className="text-xs text-bone/40">Sunset</span>
                      </div>
                      <p className="text-sm font-mono text-bone/70">
                        {sunsetTime ? formatTimeOfDay(sunsetTime) : '—'}
                      </p>
                    </div>
                  </div>
                  {sunriseTime && sunsetTime && (() => {
                    const now = Date.now();
                    const rise = new Date(sunriseTime).getTime();
                    const set = new Date(sunsetTime).getTime();
                    const total = set - rise;
                    const elapsed = Math.max(0, Math.min(total, now - rise));
                    const pct = total > 0 ? (elapsed / total) * 100 : 0;
                    return (
                      <div>
                        <div className="flex justify-between text-xs text-bone/25 mb-1">
                          <span>Dawn</span><span>Dusk</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: 'rgba(30,34,45,0.8)' }}>
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(100, pct)}%`,
                              background: 'linear-gradient(90deg, #fbbf24, #f97316)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </Card>
            )}
          </div>

          {/* Row 3: Printer + Shopping List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

            {haLoading ? <SkeletonCard delay={0.4} /> : (
              <Card delay={0.4}>
                <CardTitle>Printer Ink</CardTitle>
                <div className="space-y-3">
                  {inkLevels.map(ink => (
                    <div key={ink.label} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-16">
                        <Printer size={12} style={{ color: ink.color }} />
                        <span className="text-xs text-bone/40">{ink.label}</span>
                      </div>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(30,34,45,0.8)' }}>
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: ink.level !== null ? `${ink.level}%` : '0%',
                            background: ink.level !== null ? inkColor(ink.level) : '#64748b',
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-mono w-8 text-right"
                        style={{ color: ink.level !== null ? inkColor(ink.level) : '#64748b' }}
                      >
                        {ink.level !== null ? `${ink.level}%` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {haLoading ? <SkeletonCard delay={0.48} /> : (
              <Card delay={0.48}>
                <CardTitle>Shopping List</CardTitle>
                <div className="space-y-2">
                  <form onSubmit={addTodo} className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newTodo}
                      onChange={e => setNewTodo(e.target.value)}
                      placeholder="Add item..."
                      className="flex-1 text-sm px-3 py-2 rounded-lg"
                      style={{
                        background: 'rgba(30,34,45,0.6)',
                        border: '1px solid rgba(201,168,76,0.1)',
                        color: 'var(--bone)',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: 'rgba(201,168,76,0.1)',
                        color: 'var(--gold)',
                        border: '1px solid rgba(201,168,76,0.2)',
                      }}
                    >
                      Add
                    </button>
                  </form>
                  {todos.length === 0 ? (
                    <p className="text-xs text-bone/25 text-center py-3">List is empty</p>
                  ) : (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {todos.filter(t => t.status !== 'completed').map((item, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg"
                          style={{ background: 'rgba(30,34,45,0.4)' }}>
                          <ShoppingCart size={12} className="text-bone/30 flex-shrink-0" />
                          <span className="text-sm text-bone/70 truncate">{item.summary}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Row 4: Placeholders */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { icon: Camera, label: 'Camera feeds' },
              { icon: Sun, label: 'Lights' },
              { icon: Thermometer, label: 'Climate' },
            ].map((item, i) => (
              <div
                key={item.label}
                className="rounded-xl p-8 text-center animate-slide-up"
                style={{
                  background: 'rgba(19, 22, 29, 0.4)',
                  border: '1px dashed rgba(201, 168, 76, 0.12)',
                  animationDelay: `${0.56 + i * 0.08}s`,
                  animationFillMode: 'backwards',
                }}
              >
                <item.icon className="w-8 h-8 text-gold-dark/30 mx-auto mb-3" />
                <p className="text-sm text-gold-dark/40">{item.label} — coming soon</p>
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}
