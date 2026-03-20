import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import CalendarView from './components/CalendarView.jsx';
import ProjectsPage from './components/ProjectsPage.jsx';
import './App.css';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [weather, setWeather] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [sessions, setSessions] = useState([]);   // all Claude Code sessions (tasks)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/weather').then(r => r.json()),
      fetch('/api/schedule').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
    ]).then(([w, s, p]) => {
      setWeather(w);
      setSchedule(s);
      setSessions(p);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Auto-refresh tasks every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/projects').then(r => r.json()).then(p => setSessions(p)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const navigate = (p) => {
    setPage(p);
    setSidebarOpen(false);
  };

  // Session (task) handlers
  const handleDefer = async (sessionPath) => {
    await fetch('/api/projects/defer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectPath: sessionPath }),
    });
    setSessions(prev => prev.map(s => s.path === sessionPath ? { ...s, deferredToday: true } : s));
  };

  const handleUndefer = async (sessionPath) => {
    await fetch('/api/projects/undefer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectPath: sessionPath }),
    });
    setSessions(prev => prev.map(s => s.path === sessionPath ? { ...s, deferredToday: false } : s));
  };

  const handleComplete = async (sessionPath) => {
    await fetch('/api/projects/complete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectPath: sessionPath }),
    });
    setSessions(prev => prev.filter(s => s.path !== sessionPath));
  };

  // Schedule handlers
  const handleAddSchedule = async (item) => {
    const res = await fetch('/api/schedule', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const newItem = await res.json();
    setSchedule(prev => [...prev, newItem]);
  };

  const handleDeleteSchedule = async (id) => {
    await fetch(`/api/schedule/${id}`, { method: 'DELETE' });
    setSchedule(prev => prev.filter(s => s.id !== id));
  };

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
          <ProjectsPage allSessions={sessions} />
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
