import { useState, useEffect } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronUp,
  X, Check, FolderOpen, Bot, Edit2, Send
} from 'lucide-react';
import CaseStudyModal from './CaseStudyModal.jsx';
import './ProjectsPage.css';

const STATUS_OPTIONS = ['active', 'on hold', 'completed'];
const STATUS_STYLE = {
  active:    { bg: '#edf7f1', color: '#2e7d4f', label: 'Active' },
  'on hold': { bg: '#fff8e6', color: '#a07020', label: 'On Hold' },
  completed: { bg: 'rgba(255,92,0,0.10)', color: '#FF5C00', label: 'Completed' },
};

const COLOR_PRESETS = ['#FF5C00', '#0a0a0a', '#2e7d4f', '#c44f6e', '#1d4ed8', '#1a7a8a', '#a07020'];

function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ProjectsPage({ allSessions }) {
  const [projects, setProjects] = useState([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('#7c5cbf');

  useEffect(() => {
    fetch('/api/user-projects').then(r => r.json()).then(setProjects);
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await fetch('/api/user-projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, description: newDesc, color: newColor }),
    });
    const created = await res.json();
    setProjects(prev => [...prev, created]);
    setNewName(''); setNewDesc(''); setNewColor('#7c5cbf');
    setShowNewForm(false);
  };

  const handleDeleteProject = async (id) => {
    await fetch(`/api/user-projects/${id}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateProject = async (id, changes) => {
    const res = await fetch(`/api/user-projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
    const updated = await res.json();
    setProjects(prev => prev.map(p => p.id === id ? updated : p));
  };

  const handleAddSession = async (projectId, session) => {
    const res = await fetch(`/api/user-projects/${projectId}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionPath: session.path, sessionName: session.name }),
    });
    const updated = await res.json();
    setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
  };

  const handleRemoveSession = async (projectId, sessionPath) => {
    const res = await fetch(`/api/user-projects/${projectId}/sessions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionPath }),
    });
    const updated = await res.json();
    setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
  };

  const activeCount = projects.filter(p => p.status === 'active').length;
  const holdCount = projects.filter(p => p.status === 'on hold').length;
  const doneCount = projects.filter(p => p.status === 'completed').length;

  return (
    <div className="proj-page">
      {/* Header */}
      <div className="proj-page-header">
        <div>
          <h1 className="proj-page-title">Projects</h1>
          <p className="proj-page-sub">
            {activeCount} active · {holdCount} on hold · {doneCount} completed
          </p>
        </div>
        <button className="new-proj-btn" onClick={() => setShowNewForm(v => !v)}>
          <Plus size={16} strokeWidth={2.5} />
          New Project
        </button>
      </div>

      {/* New project form */}
      {showNewForm && (
        <form className="new-proj-form" onSubmit={handleCreateProject}>
          <div className="new-proj-row">
            <input
              className="new-proj-name"
              type="text"
              placeholder="Project name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
            />
            <div className="color-picker">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-dot ${newColor === c ? 'color-dot--active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setNewColor(c)}
                />
              ))}
            </div>
          </div>
          <input
            type="text"
            className="new-proj-desc"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
          />
          <div className="new-proj-actions">
            <button type="submit" className="btn-create">Create Project</button>
            <button type="button" className="btn-cancel-form" onClick={() => setShowNewForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Project list */}
      {projects.length === 0 && !showNewForm && (
        <div className="proj-empty">
          <FolderOpen size={40} strokeWidth={1.2} color="#d6cfc4" />
          <p>No projects yet. Create your first project to start organizing your work.</p>
        </div>
      )}

      <div className="proj-list">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            allSessions={allSessions}
            onDelete={() => handleDeleteProject(project.id)}
            onUpdate={(changes) => handleUpdateProject(project.id, changes)}
            onAddSession={(session) => handleAddSession(project.id, session)}
            onRemoveSession={(path) => handleRemoveSession(project.id, path)}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Project Card ─── */
function ProjectCard({ project, allSessions, onDelete, onUpdate, onAddSession, onRemoveSession }) {
  const [expanded, setExpanded] = useState(false);
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editDesc, setEditDesc] = useState(project.description);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [showCaseStudy, setShowCaseStudy] = useState(false);

  const statusStyle = STATUS_STYLE[project.status] || STATUS_STYLE.active;

  // Sessions not already in this project
  const availableSessions = allSessions.filter(
    s => !project.sessions.find(ps => ps.path === s.path)
  );

  const handleSaveEdit = () => {
    if (!editName.trim()) return;
    onUpdate({ name: editName, description: editDesc });
    setEditing(false);
  };

  return (
    <div className="proj-card" style={{ borderLeftColor: project.color }}>
      {/* Card header */}
      <div className="proj-card-header">
        <div className="proj-card-left">
          <span className="proj-color-bar" style={{ background: project.color }} />
          <div className="proj-card-info">
            {editing ? (
              <div className="proj-edit-form">
                <input
                  className="proj-edit-name"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditing(false); }}
                />
                <input
                  className="proj-edit-desc"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="Description"
                />
                <div className="proj-edit-btns">
                  <button className="btn-save-edit" onClick={handleSaveEdit}><Check size={14} strokeWidth={2.5} /> Save</button>
                  <button className="btn-cancel-edit" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <span className="proj-name">{project.name}</span>
                {project.description && <p className="proj-desc">{project.description}</p>}
              </>
            )}
          </div>
        </div>

        <div className="proj-card-right">
          {/* Status badge */}
          <div className="status-wrapper">
            <button
              className="status-badge"
              style={{ background: statusStyle.bg, color: statusStyle.color }}
              onClick={() => setStatusOpen(v => !v)}
            >
              {statusStyle.label} <ChevronDown size={11} strokeWidth={2.5} />
            </button>
            {statusOpen && (
              <div className="status-dropdown">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    className={`status-option ${project.status === s ? 'status-option--active' : ''}`}
                    style={project.status === s ? { color: STATUS_STYLE[s].color } : {}}
                    onClick={() => { onUpdate({ status: s }); setStatusOpen(false); }}
                  >
                    {STATUS_STYLE[s].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Publish to Lab — only for completed projects */}
          {project.status === 'completed' && (
            <button
              className="proj-publish-btn"
              onClick={() => setShowCaseStudy(true)}
              title="Publish as case study to Lab Unknown"
            >
              <Send size={13} strokeWidth={2} />
              Publish to Lab
            </button>
          )}

          {/* Actions */}
          <button className="proj-icon-btn" onClick={() => setEditing(true)} title="Edit">
            <Edit2 size={14} strokeWidth={2} />
          </button>

          {confirmDelete ? (
            <div className="confirm-delete">
              <span>Delete?</span>
              <button className="btn-confirm-yes" onClick={onDelete}><Check size={13} /></button>
              <button className="btn-confirm-no" onClick={() => setConfirmDelete(false)}><X size={13} /></button>
            </div>
          ) : (
            <button className="proj-icon-btn proj-icon-btn--danger" onClick={() => setConfirmDelete(true)} title="Delete">
              <Trash2 size={14} strokeWidth={2} />
            </button>
          )}

          {/* Expand */}
          <button className="proj-expand-btn" onClick={() => setExpanded(v => !v)}>
            <span className="proj-session-count">{project.sessions.length} sessions</span>
            {expanded ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Sessions list */}
      {expanded && (
        <div className="proj-sessions">
          {project.sessions.length === 0 ? (
            <p className="proj-no-sessions">No sessions linked yet.</p>
          ) : (
            project.sessions.map(s => {
              const liveSession = allSessions.find(ls => ls.path === s.path);
              return (
                <div key={s.path} className="proj-session-item">
                  <Bot size={14} strokeWidth={1.8} className="proj-session-icon" />
                  <span className="proj-session-name">{s.name || s.path}</span>
                  {liveSession && (
                    <span className="proj-session-time">{timeAgo(liveSession.lastActivity)}</span>
                  )}
                  <button
                    className="proj-session-remove"
                    onClick={() => onRemoveSession(s.path)}
                    title="Remove from project"
                  >
                    <X size={13} strokeWidth={2.5} />
                  </button>
                </div>
              );
            })
          )}

          {/* Add session button */}
          <button className="add-session-btn" onClick={() => setShowSessionPicker(v => !v)}>
            <Plus size={14} strokeWidth={2.5} />
            Add session
          </button>

          {/* Session picker */}
          {showSessionPicker && (
            <div className="session-picker">
              <div className="session-picker-header">
                <span>Select a Claude Code session</span>
                <button onClick={() => setShowSessionPicker(false)}><X size={14} strokeWidth={2} /></button>
              </div>
              {availableSessions.length === 0 ? (
                <p className="picker-empty">All sessions are already added, or no sessions available.</p>
              ) : (
                <div className="picker-list">
                  {availableSessions.map(s => (
                    <button
                      key={s.path}
                      className="picker-item"
                      onClick={() => { onAddSession(s); setShowSessionPicker(false); }}
                    >
                      <Bot size={14} strokeWidth={1.8} className="picker-icon" />
                      <div className="picker-item-info">
                        <span className="picker-name">{s.name}</span>
                        {s.lastMessage && <p className="picker-preview">{s.lastMessage}</p>}
                      </div>
                      <span className="picker-time">{timeAgo(s.lastActivity)}</span>
                      <Plus size={14} strokeWidth={2.5} className="picker-add-icon" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Case Study Modal */}
      {showCaseStudy && (
        <CaseStudyModal project={project} onClose={() => setShowCaseStudy(false)} />
      )}
    </div>
  );
}
