import { useState } from 'react';
import { X, Check, Loader, ExternalLink, Plus, Trash2, Sparkles } from 'lucide-react';
import './CaseStudyModal.css';

const apiBase = import.meta.env.VITE_API_URL || '';

const EMPTY_SECTION  = { label: '', title: '', body: '', callout: '' };
const EMPTY_STEP     = { title: '', text: '' };
const EMPTY_FEATURE  = { title: '', text: '' };

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-');
}

export default function CaseStudyModal({ project, onClose }) {
  const [step, setStep]         = useState(1); // 1=basics, 2=content, 3=process, 4=done
  const [saving, setSaving]     = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');

  // Form state
  const [title, setTitle]         = useState(project.name || '');
  const [tagline, setTagline]     = useState(project.description || '');
  const [tags, setTags]           = useState('');
  const [status, setStatus]       = useState('in-progress');
  const [liveUrl, setLiveUrl]     = useState('');
  const [tools, setTools]         = useState('Claude Code, Vite, React');
  const [sections, setSections]   = useState([{ ...EMPTY_SECTION, label: 'The Origin' }, { ...EMPTY_SECTION, label: 'How It Was Built' }]);
  const [processSteps, setProcess] = useState([
    { title: '', text: '' },
    { title: '', text: '' },
    { title: '', text: '' },
    { title: '', text: '' },
  ]);
  const [features, setFeatures]   = useState([{ ...EMPTY_FEATURE }]);

  // Section helpers
  const updateSection = (i, field, val) =>
    setSections(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  const addSection = () => setSections(prev => [...prev, { ...EMPTY_SECTION }]);
  const removeSection = (i) => setSections(prev => prev.filter((_, idx) => idx !== i));

  const updateStep = (i, field, val) =>
    setProcess(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const updateFeature = (i, field, val) =>
    setFeatures(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: val } : f));
  const addFeature = () => setFeatures(prev => [...prev, { ...EMPTY_FEATURE }]);
  const removeFeature = (i) => setFeatures(prev => prev.filter((_, idx) => idx !== i));

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/api/case-study/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); }
      catch { throw new Error('Backend not responding correctly — please restart the backend server (Ctrl+C → node server.js)'); }
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      const d = data.data;
      // Fill all fields from AI output
      if (d.tagline)  setTagline(d.tagline);
      if (d.tags)     setTags(d.tags);
      if (d.tools)    setTools(Array.isArray(d.tools) ? d.tools.join(', ') : d.tools);
      if (d.sections?.length) {
        setSections(d.sections.map(s => ({
          label:   s.label   || '',
          title:   s.title   || '',
          body:    s.body    || '',
          callout: s.callout || '',
        })));
      }
      if (d.processSteps?.length) {
        const steps = [...Array(4)].map((_, i) => ({
          title: d.processSteps[i]?.title || '',
          text:  d.processSteps[i]?.text  || '',
        }));
        setProcess(steps);
      }
      if (d.features?.length) {
        setFeatures(d.features.map(f => ({ title: f.title || '', text: f.text || '' })));
      }

      setGenerated(true);
      setStep(1); // go to step 1 so user can review/edit everything from the top
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/api/case-study`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slugify(title),
          tagline: tagline.trim(),
          tags: tags.trim(),
          status,
          liveUrl: liveUrl.trim(),
          sections: sections.filter(s => s.title || s.body),
          processSteps: processSteps.filter(s => s.title),
          features: features.filter(f => f.title),
          tools: tools.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setResult(data);
      setStep(4);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cs-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cs-modal">

        {/* Header */}
        <div className="cs-header">
          <div className="cs-header-left">
            <span className="cs-badge">Lab Unknown</span>
            <h2 className="cs-title">Publish Case Study</h2>
          </div>
          <button className="cs-close" onClick={onClose}><X size={18} strokeWidth={2} /></button>
        </div>

        {/* Step indicator */}
        {step < 4 && (
          <div className="cs-steps">
            {['Basics', 'Content', 'Process & Features'].map((label, i) => (
              <div
                key={i}
                className={`cs-step ${step === i + 1 ? 'cs-step--active' : ''} ${step > i + 1 ? 'cs-step--done' : ''}`}
                onClick={() => step > i + 1 && setStep(i + 1)}
              >
                <span className="cs-step-num">{step > i + 1 ? <Check size={10} strokeWidth={3} /> : i + 1}</span>
                <span className="cs-step-label">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Step 1: Basics ── */}
        {step === 1 && (
          <div className="cs-body">

            {/* AI Generate banner */}
            {!generated ? (
              <div className="cs-ai-banner">
                <div className="cs-ai-banner-left">
                  <Sparkles size={16} strokeWidth={2} className="cs-ai-icon" />
                  <div>
                    <p className="cs-ai-title">Generate with AI</p>
                    <p className="cs-ai-sub">
                      Claude reads your linked session conversations and writes the case study for you.
                      {project.sessions?.length > 0
                        ? ` ${project.sessions.length} session${project.sessions.length > 1 ? 's' : ''} linked.`
                        : ' No sessions linked — will generate from project info only.'}
                    </p>
                  </div>
                </div>
                <button
                  className="cs-ai-btn"
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating
                    ? <><Loader size={14} strokeWidth={2} className="cs-spin" /> Generating…</>
                    : <><Sparkles size={14} strokeWidth={2} /> Generate</>}
                </button>
              </div>
            ) : (
              <div className="cs-ai-done">
                <Check size={14} strokeWidth={2.5} />
                Content generated — review and edit below, then continue.
                <button className="cs-ai-regen" onClick={handleGenerate} disabled={generating}>
                  {generating ? 'Regenerating…' : 'Regenerate'}
                </button>
              </div>
            )}

            {generating && (
              <div className="cs-generating">
                <Loader size={20} strokeWidth={1.5} className="cs-spin" />
                <div>
                  <p className="cs-generating-title">Claude is reading your sessions…</p>
                  <p className="cs-generating-sub">This takes 20–40 seconds. Grab a coffee ☕</p>
                </div>
              </div>
            )}

            <div className="cs-field">
              <label className="cs-label">Title <span className="cs-req">*</span></label>
              <input className="cs-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Morning Dashboard" autoFocus />
            </div>
            <div className="cs-field">
              <label className="cs-label">Tagline / One-liner</label>
              <input className="cs-input" value={tagline} onChange={e => setTagline(e.target.value)} placeholder="A personal HQ dashboard built with React + AI, inspired by Lab Unknown." />
              <p className="cs-hint">Short description shown under the title and in lab.html listing.</p>
            </div>
            <div className="cs-field">
              <label className="cs-label">Tags</label>
              <input className="cs-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="AI · Web · Dashboard · Vibe Coding" />
              <p className="cs-hint">Shown as a pill badge. Use · to separate tags.</p>
            </div>
            <div className="cs-field">
              <label className="cs-label">Status</label>
              <div className="cs-radio-group">
                {[
                  { val: 'live',        label: 'Live — Deployed',  color: '#1a7a4a' },
                  { val: 'in-progress', label: 'In Progress',       color: '#FF5C00' },
                  { val: 'concept',     label: 'Concept',           color: '#999999' },
                ].map(opt => (
                  <label key={opt.val} className={`cs-radio ${status === opt.val ? 'cs-radio--active' : ''}`} style={status === opt.val ? { borderColor: opt.color, color: opt.color } : {}}>
                    <input type="radio" name="status" value={opt.val} checked={status === opt.val} onChange={() => setStatus(opt.val)} />
                    <span className="cs-radio-dot" style={{ background: opt.color }} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            {status === 'live' && (
              <div className="cs-field">
                <label className="cs-label">Live URL</label>
                <input className="cs-input" value={liveUrl} onChange={e => setLiveUrl(e.target.value)} placeholder="https://yourproject.netlify.app" />
              </div>
            )}
            <div className="cs-field">
              <label className="cs-label">Tools Used</label>
              <input className="cs-input" value={tools} onChange={e => setTools(e.target.value)} placeholder="Claude Code, React, Vite, Node.js, Netlify" />
              <p className="cs-hint">Comma-separated. Shown as pills at the bottom of the case study.</p>
            </div>
          </div>
        )}

        {/* ── Step 2: Content sections ── */}
        {step === 2 && (
          <div className="cs-body">
            <p className="cs-section-hint">Write 2–3 narrative sections for your case study. Each section has a label (e.g. "The Origin"), a headline, and body text.</p>
            {sections.map((s, i) => (
              <div key={i} className="cs-section-block">
                <div className="cs-section-block-header">
                  <span className="cs-section-num">Section {i + 1}</span>
                  {sections.length > 1 && (
                    <button className="cs-remove-btn" onClick={() => removeSection(i)}><Trash2 size={13} strokeWidth={2} /></button>
                  )}
                </div>
                <div className="cs-field-row">
                  <div className="cs-field cs-field--half">
                    <label className="cs-label">Label</label>
                    <input className="cs-input cs-input--sm" value={s.label} onChange={e => updateSection(i, 'label', e.target.value)} placeholder="The Origin" />
                  </div>
                  <div className="cs-field cs-field--half">
                    <label className="cs-label">Section Headline</label>
                    <input className="cs-input cs-input--sm" value={s.title} onChange={e => updateSection(i, 'title', e.target.value)} placeholder="It started with an idea." />
                  </div>
                </div>
                <div className="cs-field">
                  <label className="cs-label">Body Text</label>
                  <textarea
                    className="cs-textarea"
                    rows={4}
                    value={s.body}
                    onChange={e => updateSection(i, 'body', e.target.value)}
                    placeholder="Tell the story. Separate paragraphs with a blank line."
                  />
                </div>
                <div className="cs-field">
                  <label className="cs-label">Callout Quote <span className="cs-optional">(optional)</span></label>
                  <input className="cs-input" value={s.callout} onChange={e => updateSection(i, 'callout', e.target.value)} placeholder="A key insight or memorable quote..." />
                </div>
              </div>
            ))}
            {sections.length < 4 && (
              <button className="cs-add-section" onClick={addSection}>
                <Plus size={14} strokeWidth={2.5} /> Add section
              </button>
            )}
          </div>
        )}

        {/* ── Step 3: Process + Features ── */}
        {step === 3 && (
          <div className="cs-body">
            <div className="cs-group-label">Process Steps <span className="cs-optional">(optional — up to 4)</span></div>
            <p className="cs-section-hint">Describe how the project was built, step by step. Leave blank to skip.</p>
            <div className="cs-steps-grid">
              {processSteps.map((s, i) => (
                <div key={i} className="cs-process-block">
                  <span className="cs-process-num">Step 0{i + 1}</span>
                  <input
                    className="cs-input cs-input--sm"
                    placeholder="Step title"
                    value={s.title}
                    onChange={e => updateStep(i, 'title', e.target.value)}
                  />
                  <textarea
                    className="cs-textarea cs-textarea--sm"
                    rows={2}
                    placeholder="What happened in this step..."
                    value={s.text}
                    onChange={e => updateStep(i, 'text', e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="cs-group-label" style={{ marginTop: 28 }}>
              Key Features <span className="cs-optional">(optional)</span>
            </div>
            <p className="cs-section-hint">List the main things your project does. Leave blank to skip.</p>
            {features.map((f, i) => (
              <div key={i} className="cs-feature-row">
                <input
                  className="cs-input cs-input--sm"
                  placeholder="Feature name"
                  value={f.title}
                  onChange={e => updateFeature(i, 'title', e.target.value)}
                  style={{ flex: '0 0 200px' }}
                />
                <input
                  className="cs-input cs-input--sm"
                  placeholder="Short description (optional)"
                  value={f.text}
                  onChange={e => updateFeature(i, 'text', e.target.value)}
                  style={{ flex: 1 }}
                />
                {features.length > 1 && (
                  <button className="cs-remove-btn" onClick={() => removeFeature(i)}><Trash2 size={13} strokeWidth={2} /></button>
                )}
              </div>
            ))}
            <button className="cs-add-section" onClick={addFeature} style={{ marginTop: 8 }}>
              <Plus size={14} strokeWidth={2.5} /> Add feature
            </button>
          </div>
        )}

        {/* ── Step 4: Done ── */}
        {step === 4 && result && (
          <div className="cs-body cs-done">
            <div className="cs-done-icon">✓</div>
            <h3 className="cs-done-title">Case study saved!</h3>
            <p className="cs-done-path">{result.filepath}</p>
            <p className="cs-done-note">
              The file has been saved to your Lab Unknown folder and added to <strong>lab.html</strong>.
              Open the folder, add a screenshot to <code>img/Lab/</code>, then drag-and-drop to Netlify to deploy.
            </p>
            <div className="cs-done-actions">
              <button
                className="cs-done-open"
                onClick={() => fetch(`${apiBase}/api/open-url`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: 'https://labunknown.ca' }) })}
              >
                <ExternalLink size={14} strokeWidth={2} /> Visit labunknown.ca
              </button>
              <button className="cs-done-close" onClick={onClose}>Close</button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && <p className="cs-error">{error}</p>}

        {/* Footer nav */}
        {step < 4 && (
          <div className="cs-footer">
            {step > 1
              ? <button className="cs-btn-back" onClick={() => setStep(s => s - 1)}>← Back</button>
              : <span />
            }
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="cs-btn-cancel" onClick={onClose}>Cancel</button>
              {step < 3
                ? <button className="cs-btn-next" onClick={() => setStep(s => s + 1)}>Continue →</button>
                : <button className="cs-btn-publish" onClick={handleSubmit} disabled={saving}>
                    {saving ? <><Loader size={14} strokeWidth={2} className="cs-spin" /> Saving...</> : 'Publish to Lab →'}
                  </button>
              }
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
