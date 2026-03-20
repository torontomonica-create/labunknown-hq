import { ExternalLink, LayoutDashboard, Calendar, FolderKanban, Users, FileText, Clock, StickyNote, Settings } from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'calendar',  icon: Calendar,        label: 'Calendar' },
  { id: 'projects',  icon: FolderKanban,    label: 'Projects' },
];

const FREELANCE_ITEMS = [
  { id: 'clients',  icon: Users,      label: 'Clients' },
  { id: 'invoices', icon: FileText,   label: 'Invoices' },
  { id: 'time',     icon: Clock,      label: 'Time Tracking' },
  { id: 'notes',    icon: StickyNote, label: 'Notes' },
];

function openLabUnknown() {
  fetch('/api/open-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://labunknown.ca' }),
  });
}

export default function Sidebar({ currentPage, onNavigate, isOpen, onClose }) {
  return (
    <nav className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      {/* Logo / Brand */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="sidebar-logo-text">Lab Unknown</span>
          <span className="sidebar-logo-dot">.</span>
        </div>
        <span className="sidebar-hq-badge">HQ</span>
      </div>

      <div className="sidebar-section">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`sidebar-item ${currentPage === id ? 'sidebar-item--active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon size={16} strokeWidth={1.8} className="sidebar-icon" />
            <span className="sidebar-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <p className="sidebar-section-title">Freelance</p>
        {FREELANCE_ITEMS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`sidebar-item sidebar-item--soon ${currentPage === id ? 'sidebar-item--active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon size={16} strokeWidth={1.8} className="sidebar-icon" />
            <span className="sidebar-label">{label}</span>
            <span className="sidebar-soon">Soon</span>
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        {/* Visit labunknown.ca */}
        <button className="sidebar-visit-btn" onClick={openLabUnknown}>
          <span className="sidebar-visit-logo">labunknown.ca</span>
          <ExternalLink size={12} strokeWidth={2} className="sidebar-visit-icon" />
        </button>

        <div className="sidebar-divider" style={{ margin: '6px 0' }} />

        <button className="sidebar-item sidebar-item--soon">
          <Settings size={16} strokeWidth={1.8} className="sidebar-icon" />
          <span className="sidebar-label">Settings</span>
          <span className="sidebar-soon">Soon</span>
        </button>
      </div>
    </nav>
  );
}
