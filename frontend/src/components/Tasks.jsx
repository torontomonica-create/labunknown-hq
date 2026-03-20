import { useState } from 'react';
import { Bot, ChevronDown, ChevronUp, SkipForward, RotateCcw, CheckCircle, Loader } from 'lucide-react';
import './Tasks.css';

function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function Tasks({ sessions, onDefer, onUndefer, onComplete }) {
  const [showDeferred, setShowDeferred] = useState(false);
  const active   = sessions.filter(s => s.status !== 'deferred' && !s.deferredToday);
  const deferred = sessions.filter(s => s.status === 'deferred' || s.deferredToday);

  return (
    <div className="tasks-card">
      <div className="tasks-header">
        <h2 className="tasks-title">Tasks</h2>
        <div className="tasks-meta">
          <span className="tasks-count">{active.length} active</span>
          {deferred.length > 0 && (
            <button className="btn-deferred-toggle" onClick={() => setShowDeferred(v => !v)}>
              {deferred.length} deferred
              {showDeferred ? <ChevronUp size={13} strokeWidth={2} /> : <ChevronDown size={13} strokeWidth={2} />}
            </button>
          )}
        </div>
      </div>

      {active.length === 0 && (
        <p className="tasks-empty">All clear — nothing to continue today</p>
      )}

      <div className="tasks-list">
        {active.map(s => (
          <TaskItem key={s.path} session={s} onDefer={onDefer} onComplete={onComplete} />
        ))}
      </div>

      {showDeferred && deferred.length > 0 && (
        <div className="tasks-deferred">
          <p className="tasks-deferred-label">Deferred today</p>
          {deferred.map(s => (
            <TaskItem key={s.path} session={s} deferred onUndefer={onUndefer} onComplete={onComplete} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskItem({ session, deferred, onDefer, onUndefer, onComplete }) {
  const [expanded, setExpanded]               = useState(false);
  const [summary, setSummary]                 = useState(null);
  const [loadingSummary, setLoadingSummary]   = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);

  const handleExpand = async () => {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (summary) return;
    setLoadingSummary(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const body = session.type === 'supabase'
        ? { text: session.lastMessage || '', projectName: session.name }
        : { type: session.type, projectPath: session.path };
      const res  = await fetch(`${apiBase}/api/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      // Handle both { lines: [...] } and { summary: "..." } shapes
      if (data.lines) {
        setSummary(data.lines);
      } else if (data.summary) {
        setSummary([{ label: 'AI Summary', content: data.summary }]);
      } else {
        setSummary([{ label: 'Info', content: 'No summary available.' }]);
      }
    } catch {
      setSummary([{ label: 'Error', content: 'Could not load summary.' }]);
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <div className={`task-item${deferred ? ' task-item--deferred' : ''}${expanded ? ' task-item--expanded' : ''}`}>

      {/* ── clickable header row ── */}
      <div className="task-row" onClick={handleExpand}>
        <Bot size={16} strokeWidth={1.8} className="task-bot-icon" />

        <div className="task-body">
          <span className="task-name">{session.name}</span>
          {session.lastMessage && !expanded && (
            <p className="task-preview">{session.lastMessage}</p>
          )}
        </div>

        <div className="task-right">
          <span className="task-time">{timeAgo(session.lastActivity)}</span>
          {expanded
            ? <ChevronUp  size={14} strokeWidth={2} className="task-caret" />
            : <ChevronDown size={14} strokeWidth={2} className="task-caret" />}
        </div>
      </div>

      {/* ── action bar ── */}
      <div className="task-actions">
        {!deferred
          ? <button className="task-btn task-btn--skip"
                    onClick={e => { e.stopPropagation(); onDefer(session.path); }}>
              <SkipForward size={13} strokeWidth={2} /> Skip today
            </button>
          : <button className="task-btn task-btn--restore"
                    onClick={e => { e.stopPropagation(); onUndefer(session.path); }}>
              <RotateCcw size={13} strokeWidth={2} /> Restore
            </button>
        }

        {confirmComplete
          ? <>
              <span className="task-confirm-label">Mark as done?</span>
              <button className="task-btn task-btn--yes"
                      onClick={e => { e.stopPropagation(); onComplete(session.path); }}>Yes</button>
              <button className="task-btn task-btn--no"
                      onClick={e => { e.stopPropagation(); setConfirmComplete(false); }}>No</button>
            </>
          : <button className="task-btn task-btn--done"
                    onClick={e => { e.stopPropagation(); setConfirmComplete(true); }}>
              <CheckCircle size={13} strokeWidth={2} /> Done
            </button>
        }
      </div>

      {/* ── conversation history ── */}
      {expanded && (
        <div className="task-summary">
          <p className="task-path">{session.path}</p>
          {loadingSummary
            ? <div className="task-loading">
                <Loader size={14} strokeWidth={2} className="task-spin" /> Loading conversation history...
              </div>
            : summary?.map((sec, i) => (
                <div key={i} className="task-section">
                  <p className="task-section-label">{sec.label}</p>
                  <pre className="task-section-content">{sec.content}</pre>
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}
