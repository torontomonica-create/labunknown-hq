import { useState } from 'react';
import { Bot, ChevronDown, ChevronUp, SkipForward, RotateCcw, CheckCircle, Loader } from 'lucide-react';
import './Projects.css';

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

export default function Projects({ projects, onDefer, onUndefer, onComplete }) {
  const [showDeferred, setShowDeferred] = useState(false);
  const active = projects.filter(p => !p.deferredToday);
  const deferred = projects.filter(p => p.deferredToday);

  return (
    <div className="projects-card">
      <div className="projects-header">
        <h2 className="projects-title">Claude Code Projects</h2>
        <div className="projects-header-right">
          <span className="projects-count">{active.length} active</span>
          {deferred.length > 0 && (
            <button className="deferred-toggle" onClick={() => setShowDeferred(v => !v)}>
              {deferred.length} deferred {showDeferred ? <ChevronUp size={12} strokeWidth={2} /> : <ChevronDown size={12} strokeWidth={2} />}
            </button>
          )}
        </div>
      </div>

      {active.length === 0 && (
        <p className="empty-msg">All clear — nothing to continue today</p>
      )}

      <div className="projects-list">
        {active.map(p => (
          <ProjectItem key={p.path} project={p} onDefer={onDefer} onComplete={onComplete} />
        ))}
      </div>

      {showDeferred && deferred.length > 0 && (
        <div className="deferred-section">
          <p className="deferred-label">Deferred today</p>
          {deferred.map(p => (
            <ProjectItem key={p.path} project={p} deferred onUndefer={onUndefer} onComplete={onComplete} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectItem({ project, deferred, onDefer, onUndefer, onComplete }) {
  const [expanded, setExpanded] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);

  const handleExpand = async () => {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (summary) return;
    setLoadingSummary(true);
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: project.type, projectPath: project.path }),
      });
      const data = await res.json();
      setSummary(data.lines || []);
    } catch {
      setSummary([{ label: 'Error', content: 'Could not load conversation history.' }]);
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <div className={`project-item ${deferred ? 'project-item--deferred' : ''} ${expanded ? 'project-item--expanded' : ''}`}>
      <div className="project-row" onClick={handleExpand}>
        <div className="project-main">
          <Bot size={15} strokeWidth={1.8} className="project-icon" />
          <div className="project-info">
            <span className="project-name">{project.name}</span>
            {project.lastMessage && !expanded && (
              <p className="project-preview">{project.lastMessage}</p>
            )}
          </div>
        </div>
        <div className="project-meta">
          <span className="project-time">{timeAgo(project.lastActivity)}</span>
          {expanded
            ? <ChevronUp size={13} strokeWidth={2} className="expand-caret" />
            : <ChevronDown size={13} strokeWidth={2} className="expand-caret" />
          }
        </div>
      </div>

      <div className="project-actions">
        {!deferred ? (
          <button className="btn-action btn-defer"
            onClick={e => { e.stopPropagation(); onDefer(project.path); }}>
            <SkipForward size={12} strokeWidth={2} /> Skip today
          </button>
        ) : (
          <button className="btn-action btn-undefer"
            onClick={e => { e.stopPropagation(); onUndefer(project.path); }}>
            <RotateCcw size={12} strokeWidth={2} /> Restore
          </button>
        )}
        {confirmComplete ? (
          <>
            <span className="confirm-text">Mark as done?</span>
            <button className="btn-action btn-yes"
              onClick={e => { e.stopPropagation(); onComplete(project.path); }}>Yes</button>
            <button className="btn-action btn-no"
              onClick={e => { e.stopPropagation(); setConfirmComplete(false); }}>No</button>
          </>
        ) : (
          <button className="btn-action btn-complete"
            onClick={e => { e.stopPropagation(); setConfirmComplete(true); }}>
            <CheckCircle size={12} strokeWidth={2} /> Done
          </button>
        )}
      </div>

      {expanded && (
        <div className="project-summary">
          <p className="project-path">{project.path}</p>
          {loadingSummary ? (
            <div className="summary-loading">
              <Loader size={14} strokeWidth={2} className="spin-icon" />
              <span>Loading conversation history...</span>
            </div>
          ) : summary ? (
            summary.map((section, i) => (
              <div key={i} className="summary-section">
                <p className="summary-label">{section.label}</p>
                <pre className="summary-content">{section.content}</pre>
              </div>
            ))
          ) : null}
        </div>
      )}
    </div>
  );
}
