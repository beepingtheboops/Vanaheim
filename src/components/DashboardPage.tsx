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
      const res = await fetch('/api/ha/api/states');
      if (!res.ok) throw new Error('Failed to fetch HA states');
      const data = await res.json();
      const map: Record<string, HaState> = {};
      data.forEach((s: HaState) => { map[s.entity_id] = s; });
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
      const res = await fetch('/api/ha/api/services/todo/get_items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_id: 'todo.family_shopping_list' }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const items = data?.['todo.family_shopping_list']?.items ?? [];
      setTodos(items.filter((i: TodoItem) => i.status !== 'completed'));
    } catch {
      // Ignore todo errors
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchStates();
    fetchTodos();
    const interval = setInterval(() => {
      fetchStates();
      fetchTodos();
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [user, fetchStates, fetchTodos]);

  const toggleLock = async (entityId: string) => {
    setLockLoading(true);
    const currentState = states[entityId]?.state;
    const service = currentState === 'locked' ? 'unlock' : 'lock';
    try {
      await fetch('/api/ha/api/services/lock/' + service, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_id: entityId }),
      });
      setTimeout(fetchStates, 1000);
    } catch {
      // Ignore
    } finally {
      setLockLoading(false);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      await fetch('/api/ha/api/services/todo/add_item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: 'todo.family_shopping_list',
          item: newTodo.trim(),
        }),
      });
      setNewTodo('');
      setTimeout(fetchTodos, 500);
    } catch {
      // Ignore
    }
  };

  if (loading || !user) {
    return (
      <div className="grain-overlay min-h-screen bg-void flex items-center justify-center">
        <div className="text-bone/50">Loading...</div>
      </div>
    );
  }

  const lockEntity = states[ENTITIES.locks[0]];
  const lockState = lockEntity?.state ?? 'unknown';
  const lockBattery = states[ENTITIES.lockBattery]?.state ?? '—';
  const lockOperator = states[ENTITIES.lockOperator]?.state ?? '—';

  const weatherEntity = states[ENTITIES.weather];
  const temp = weatherEntity?.attributes?.temperature ?? '—';
  const condition = (weatherEntity?.attributes?.condition ?? 'unknown') as string;
  const forecast = (weatherEntity?.attributes?.forecast ?? []) as any[];
  const todayForecast = forecast[0] ?? {};

  const personEntity = states[ENTITIES.person];
  const personState = personEntity?.state ?? '—';
  const personChanged = personEntity?.last_changed;

  const wanEntity = states[ENTITIES.wanStatus];
  const wanOnline = wanEntity?.state === 'on';
  const ipEntity = states[ENTITIES.externalIp];
  const externalIp = ipEntity?.state ?? '—';

  const sunEntity = states[ENTITIES.sun];
  const sunNextRising = sunEntity?.attributes?.next_rising;
  const sunNextSetting = sunEntity?.attributes?.next_setting;

  const blackInk = parseInt(states[ENTITIES.printerBlack]?.state ?? '0');
  const cyanInk = parseInt(states[ENTITIES.printerCyan]?.state ?? '0');
  const magentaInk = parseInt(states[ENTITIES.printerMagenta]?.state ?? '0');
  const yellowInk = parseInt(states[ENTITIES.printerYellow]?.state ?? '0');

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
              {haError ? 'Unable to reach Home Assistant — check your connection.' : 'All systems operational'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* Front Door Lock */}
            <Card delay={0.05}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium tracking-wider text-gold-dark uppercase">Front Door</h3>
                <Lock size={16} className="text-gold/40" />
              </div>
              <button
                onClick={() => toggleLock(ENTITIES.locks[0])}
                disabled={lockLoading || haLoading}
                className="w-full p-4 rounded-lg transition-all duration-200 mb-3"
                style={{
                  background: lockState === 'locked'
                    ? 'rgba(34, 197, 94, 0.08)'
                    : 'rgba(239, 68, 68, 0.08)',
                  border: lockState === 'locked'
                    ? '1px solid rgba(34, 197, 94, 0.2)'
                    : '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <div className="flex items-center gap-3">
                  {lockState === 'locked' ? (
                    <Lock size={20} className="text-green-400" />
                  ) : (
                    <Unlock size={20} className="text-red-400" />
                  )}
                  <span className="text-sm font-medium text-bone">
                    {lockLoading ? 'Processing...' : capitalize(lockState)}
                  </span>
                </div>
              </button>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-bone/40">
                  <Battery size={14} />
                  <span>{lockBattery}%</span>
                </div>
                <div className="text-bone/40">
                  <span>Last: {lockOperator}</span>
                </div>
              </div>
            </Card>

            {/* Presence */}
            <Card delay={0.1}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium tracking-wider text-gold-dark uppercase">Presence</h3>
                <MapPin size={16} className="text-gold/40" />
              </div>
              <div className="flex items-center gap-4 mb-2">
                <div className="text-3xl">{user.avatar}</div>
                <div>
                  <p className="text-sm font-medium text-bone">{user.name}</p>
                  <p className={`text-xs ${personState === 'home' ? 'text-green-400' : 'text-bone/40'}`}>
                    {personState === 'home' ? '● ' : '○ '}{capitalize(personState)}
                  </p>
                </div>
              </div>
              {personChanged && (
                <p className="text-xs text-bone/30 mt-2">
                  {formatTime(personChanged)}
                </p>
              )}
              <p className="text-xs text-bone/40 mt-4">
                Add family members in HA to track everyone
              </p>
            </Card>

            {/* Network */}
            <Card delay={0.15}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium tracking-wider text-gold-dark uppercase">Network</h3>
                <Wifi size={16} className="text-gold/40" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: wanOnline ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  }}
                >
                  <Wifi
                    size={20}
                    className={wanOnline ? 'text-green-400' : 'text-red-400'}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-bone">Internet</p>
                  <p className={`text-xs ${wanOnline ? 'text-green-400' : 'text-red-400'}`}>
                    {wanOnline ? '● Online' : '● Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-bone/40">
                <span>Provider</span>
                <span>Eero</span>
              </div>
            </Card>

            {/* Weather */}
            <Card delay={0.2}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium tracking-wider text-gold-dark uppercase">Weather</h3>
                <Cloud size={16} className="text-gold/40" />
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-display text-bone">{temp}°</div>
                <div className="text-right">
                  <p className="text-sm text-bone/60 capitalize">{condition}</p>
                  <p className="text-xs text-bone/40">
                    {todayForecast?.templow ?? '—'}° / {todayForecast?.temperature ?? '—'}°
                  </p>
                </div>
              </div>
            </Card>

            {/* Daylight */}
            <Card delay={0.25}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-medium tracking-wider text-gold-dark uppercase">Daylight</h3>
                <Sun size={16} className="text-gold/40" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255, 193, 7, 0.1)' }}
                >
                  <Sun size={20} className="text-yellow-400" />
                </div>
                <span className="text-sm font-medium text-bone">Day</span>
              </div>
              <div className="space-y-2 text-xs text-bone/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sunrise size={14} />
                    <span>Sunrise</span>
                  </div>
                  <span>{sunNextRising ? formatTimeOfDay(sunNextRising) : '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sunset size={14} />
                    <span>Sunset</span>
                  </div>
                  <span>{sunNextSetting ? formatTimeOfDay(sunNextSetting) : '—'}</span>
                </div>
              </div>
            </Card>

            {/* Printer Ink */}
            <Card delay={0.3}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-medium tracking-wider text-gold-dark uppercase">Printer Ink</h3>
                <Printer size={16} className="text-gold/40" />
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Black', level: blackInk },
                  { label: 'Cyan', level: cyanInk },
                  { label: 'Magenta', level: magentaInk },
                  { label: 'Yellow', level: yellowInk },
                ].map(ink => (
                  <div key={ink.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplet size={14} style={{ color: inkColor(ink.level) }} />
                      <span className="text-xs text-bone/60">{ink.label}</span>
                    </div>
                    <span className="text-xs text-bone/40">{ink.level}%</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Shopping List */}
            <Card delay={0.35} className="md:col-span-2 lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-medium tracking-wider text-gold-dark uppercase">Shopping List</h3>
                <ShoppingCart size={16} className="text-gold/40" />
              </div>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTodo}
                  onChange={e => setNewTodo(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addTodo(); }}
                  placeholder="Add item..."
                  className="flex-1 px-4 py-2 rounded-lg text-sm bg-smoke/30 border border-bone/10 text-bone placeholder:text-bone/30 focus:outline-none focus:border-gold/30"
                />
                <button
                  onClick={addTodo}
                  className="px-6 py-2 rounded-lg bg-gold/10 border border-gold/20 text-gold text-sm font-medium hover:bg-gold/20 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {todos.length === 0 ? (
                  <p className="text-xs text-bone/30 text-center py-4">List is empty</p>
                ) : (
                  todos.map(todo => (
                    <div
                      key={todo.uid}
                      className="flex items-center gap-3 px-4 py-2 rounded-lg bg-smoke/20"
                    >
                      <div className="w-4 h-4 rounded border border-bone/20" />
                      <span className="text-sm text-bone/70">{todo.summary}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>

          </div>
        </main>
      </div>
    </div>
  );
}
