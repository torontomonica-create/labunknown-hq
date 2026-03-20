import { Mail, Facebook, Linkedin, ExternalLink } from 'lucide-react';
import './InboxPanel.css';

const LINKS = [
  {
    id: 'yahoo',
    label: 'Yahoo Mail',
    Icon: Mail,
    url: 'https://mail.yahoo.com',
    accent: '#7c5cbf',
    bg: '#ede8f7',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    Icon: Facebook,
    url: 'https://www.facebook.com',
    accent: '#1e2a4a',
    bg: '#dde3f0',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    Icon: Linkedin,
    url: 'https://www.linkedin.com',
    accent: '#0a66c2',
    bg: '#ddedf9',
  },
];

export default function InboxPanel() {
  const handleOpen = async (url) => {
    try {
      await fetch('/api/open-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="inbox-panel">
      <p className="inbox-label">Quick Access</p>
      <div className="inbox-links">
        {LINKS.map(({ id, label, Icon, url, accent, bg }) => (
          <button key={id} className="inbox-btn" onClick={() => handleOpen(url)}>
            <span className="inbox-icon" style={{ background: bg, color: accent }}>
              <Icon size={16} strokeWidth={2} />
            </span>
            <span className="inbox-name">{label}</span>
            <ExternalLink size={12} strokeWidth={2} className="inbox-arrow" />
          </button>
        ))}
      </div>
    </div>
  );
}
