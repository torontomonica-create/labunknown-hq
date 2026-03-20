import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import CalendarView from './components/CalendarView.jsx';
import ProjectsPage from './components/ProjectsPage.jsx';
import Login from './components/Login.jsx';
import { supabase } from './lib/supabase.js';
import './App.css';

const apiBase = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [weather, setWeather] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [sessions, setSessions] = useState([]);   // tasks from Supabase (+ local Claude Code on dev)
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Load weather (backend), schedule + tasks (Supabase)
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [weatherRes, scheduleRes, tasksRes] = await Promise.all([
          fetch(`${apiBase}/api/weather`).then(r => r.json()),
          supabase
            .from('schedule')
            .select('*')
            .eq('user_id', user.id)
            .order('date'),
          supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .neq('status', 'completed')
            .order('created_at', { ascending: false }),
        ]);

        setWeather(weatherRes);
        setSchedule(scheduleRes.data || []);

        // Map Supabase tasks to the shape components expect
        const supabaseTasks = (tasksRes.data || []).map(t => ({
          id: t.id,
          name: t.title,
          project: t.project,
          status: t.status,
          lastActivity: t.date || t.created_at,
          lastMessage: t.project || '',
          deferredToday: t.status === 'deferred',
          type: 'supabase',
          path: String(t.id), // unique key for components
        }));

        // On local dev, also scan Claude Code sessions and merge
        if (import.meta.env.DEV) {
          try {
            const localRes = await fetch(`${apiBase}/api/projects`).then(r => r.json()).catch(() => []);
            const localTasks = Array.isArray(localRes) ? localRes : [];
            // Merge: local tasks first, then Supabase tasks
            setSessions([...localTasks, ...supabaseTasks]);
          } catch {
            setSessions(supabaseTasks);
          }
        } else {
          setSessions(supabaseTasks);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Auto-refresh tasks every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'completed')
        .order('created_at', { ascending: false });

      const supabaseTasks = (data || []).map(t => ({
        id: t.id,
        name: t.title,
        project: t.project,
        status: t.status,
        lastActivity: t.date || t.created_at,
        lastMessage: t.project || '',
        deferredToday: t.status === 'deferred',
        type: 'supabase',
        path: String(t.id),
      }));

      setSessions(prev => {
        // Keep any local (non-supabase) sessions from the previous state
        const localOnly = prev.filter(s => s.type !== 'supabase');
        return [...localOnly, ...supabaseTasks];
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const navigate = (p) => {
    setPage(p);
    setSidebarOpen(false);
  };

  // Task handlers
  const handleDefer = async (sessionPath) => {
    const session = sessions.find(s => s.path === sessionPath);
    if (session?.type === 'supabase') {
      await supabase
        .from('tasks')
        .update({ status: 'deferred' })
        .eq('id', session.id)
        .eq('user_id', user.id);
    } else {
      await fetch(`${apiBase}/api/projects/defer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath: sessionPath }),
      });
    }
    setSessions(prev => prev.map(s => s.path === sessionPath ? { ...s, deferredToday: true, status: 'deferred' } : s));
  };

  const handleUndefer = async (sessionPath) => {
    const session = sessions.find(s => s.path === sessionPath);
    if (session?.type === 'supabase') {
      await supabase
        .from('tasks')
        .update({ status: 'active' })
        .eq('id', session.id)
        .eq('user_id', user.id);
    } else {
      await fetch(`${apiBase}/api/projects/undefer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath: sessionPath }),
      });
    }
    setSessions(prev => prev.map(s => s.path === sessionPath ? { ...s, deferredToday: false, status: 'active' } : s));
  };

  const handleComplete = async (sessionPath) => {
    const session = sessions.find(s => s.path === sessionPath);
    if (session?.type === 'supabase') {
      await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', session.id)
        .eq('user_id', user.id);
    } else {
      await fetch(`${apiBase}/api/projects/complete`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath: sessionPath }),
      });
    }
    setSessions(prev => prev.filter(s => s.path !== sessionPath));
  };

  // Schedule handlers
  const handleAddSchedule = async (item) => {
    const { data, error } = await supabase
      .from('schedule')
      .insert({ user_id: user.id, text: item.text, date: item.date, time: item.time })
      .select()
      .single();

    if (!error && data) {
      setSchedule(prev => [...prev, data]);
    }
  };

  const handleDeleteSchedule = async (id) => {
    await supabase
      .from('schedule')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    setSchedule(prev => prev.filter(s => s.id !== id));
  };

  // Show nothing until auth is checked
  if (!authChecked) return null;

  // Show login if not authenticated
  if (!user) return <Login onLogin={setUser} />;

  const isGuest = user?.email === 'guest@labunknown.demo';

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        currentPage={page}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="app-main">
        {/* Demo mode banner */}
        {isGuest && (
          <div className="demo-banner">
            <span className="demo-banner-dot" />
            <span>Demo Mode — Sample data only. Sign in with an owner account to use full features.</span>
          </div>
        )}

        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <button className="mobile-hamburger" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} strokeWidth={2} />
          </button>
          <span className="mobile-title">Morning Dashboard</span>
        </div>

        {page === 'dashboard' && (
          <Dashboard
            weather={weather}
            schedule={schedule}
            sessions={sessions}
            onDefer={handleDefer}
            onUndefer={handleUndefer}
            onComplete={handleComplete}
            onAddSchedule={handleAddSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onNavigateCalendar={() => navigate('calendar')}
          />
        )}
        {page === 'calendar' && (
          <CalendarView
            schedule={schedule}
            onAdd={handleAddSchedule}
            onDelete={handleDeleteSchedule}
          />
        )}
        {page === 'projects' && (
          <ProjectsPage allSessions={sessions} user={user} />
        )}
        {['clients', 'invoices', 'time', 'notes'].includes(page) && (
          <div className="coming-soon-page">
            <h2>Coming Soon</h2>
            <p>This feature is planned for a future update.</p>
          </div>
        )}
      </main>
    </div>
  );
}
