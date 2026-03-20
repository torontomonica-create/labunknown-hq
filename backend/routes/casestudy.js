import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

const router = express.Router();
const LAB_DIR = 'C:\\Users\\jmy97\\OneDrive\\Desktop\\Lab Unknown';

function generateSlug(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateHTML(data) {
  const { title, slug, tagline, tags, status, liveUrl, sections, processSteps, features, tools } = data;
  const year = new Date().getFullYear();

  const statusBadge = status === 'live'
    ? `<div class="lab-status-live"><span class="live-dot"></span>Live — Deployed</div>`
    : status === 'in-progress'
    ? `<div class="lab-status-inprogress"><span class="inprogress-dot"></span>In Progress</div>`
    : `<div class="lab-status-concept"><span class="concept-dot"></span>Concept</div>`;

  const sectionsHTML = (sections || []).filter(s => s.title || s.body).map(s => `
      <div class="lab-section">
        <p class="lab-section-label">${esc(s.label || 'Overview')}</p>
        <h2 class="lab-section-title">${esc(s.title)}</h2>
        ${(s.body || '').split('\n\n').filter(p => p.trim()).map(p =>
          `<p class="lab-p">${esc(p.trim())}</p>`).join('\n        ')}
        ${s.callout ? `<div class="lab-callout"><p>"${esc(s.callout)}"</p></div>` : ''}
      </div>`).join('\n');

  const processHTML = (processSteps || []).filter(s => s.title).length > 0 ? `
      <div class="lab-section">
        <p class="lab-section-label">How It Was Built</p>
        <h2 class="lab-section-title">The process, step by step.</h2>
        <div class="process-steps">
          ${(processSteps || []).map((step, i) => `<div class="process-step">
            <p class="process-step-num">Step 0${i + 1}</p>
            <p class="process-step-title">${esc(step.title)}</p>
            <p class="process-step-text">${esc(step.text || '')}</p>
          </div>`).join('\n          ')}
        </div>
      </div>` : '';

  const featuresHTML = (features || []).filter(f => f.title).length > 0 ? `
      <div class="lab-section">
        <p class="lab-section-label">What It Does</p>
        <h2 class="lab-section-title">Features at a glance.</h2>
        <ul class="feature-list">
          ${(features || []).filter(f => f.title).map(f => `<li>
            <span class="feature-icon">→</span>
            <span><strong>${esc(f.title)}</strong>${f.text ? ' — ' + esc(f.text) : ''}</span>
          </li>`).join('\n          ')}
        </ul>
      </div>` : '';

  const liveBtn = liveUrl ? `
        <a href="${esc(liveUrl)}" target="_blank" rel="noopener" class="lab-live-btn">
          View Live Project
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 12L12 2M12 2H6M12 2v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>` : '';

  const toolsHTML = (tools || []).filter(Boolean).length > 0 ? `
      <div class="lab-section">
        <p class="lab-section-label">Tools</p>
        <div class="lab-tools">
          ${(tools || []).filter(Boolean).map(t => `<span class="lab-tool-pill">${esc(t.trim())}</span>`).join('\n          ')}
        </div>
      </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lab Unknown — ${esc(title)}</title>
  <link rel="stylesheet" href="style.css" />
  <link rel="icon" type="image/x-icon" href="fav/favicon.ico" />
  <link rel="icon" type="image/png" sizes="32x32" href="fav/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="fav/favicon-16x16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="fav/apple-touch-icon.png" />
  <link rel="manifest" href="fav/site.webmanifest" />
  <style>
    .lab-wrap { max-width: var(--max-w); margin: 0 auto; padding: 80px 40px 100px; }
    .lab-breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 0.78rem; color: var(--gray-4); margin-bottom: 40px; }
    .lab-breadcrumb a { transition: color 0.2s; }
    .lab-breadcrumb a:hover { color: var(--black); }
    .lab-breadcrumb span { color: var(--gray-3); }
    .lab-status-live { display: inline-flex; align-items: center; gap: 6px; font-size: 0.65rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #1a7a4a; background: #e8f7ef; border: 1px solid #1a7a4a; border-radius: 100px; padding: 4px 12px; margin-bottom: 28px; }
    .live-dot { width: 5px; height: 5px; border-radius: 50%; background: #1a7a4a; animation: blink 2.5s ease-in-out infinite; }
    .lab-status-inprogress { display: inline-flex; align-items: center; gap: 6px; font-size: 0.65rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--accent); background: var(--accent-hl); border: 1px solid var(--accent); border-radius: 100px; padding: 4px 12px; margin-bottom: 28px; }
    .inprogress-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); animation: blink 2.5s ease-in-out infinite; }
    .lab-status-concept { display: inline-flex; align-items: center; gap: 6px; font-size: 0.65rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #555555; background: #f7f7f7; border: 1px solid #cccccc; border-radius: 100px; padding: 4px 12px; margin-bottom: 28px; }
    .concept-dot { width: 5px; height: 5px; border-radius: 50%; background: #999999; }
    .lab-tag { display: inline-block; font-size: 0.72rem; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--gray-4); background: var(--gray-1); border: 1px solid var(--gray-2); padding: 5px 12px; border-radius: 100px; margin-bottom: 24px; }
    .lab-title { font-family: var(--font-head); font-size: clamp(36px, 5vw, 72px); font-weight: 800; line-height: 0.95; letter-spacing: -2px; color: var(--black); margin-bottom: 24px; }
    .lab-subtitle { font-size: 1.1rem; color: var(--gray-5); line-height: 1.75; max-width: 600px; margin-bottom: 56px; }
    .lab-mockup { width: 100%; background: #0a0a0a; border-radius: 4px; overflow: hidden; margin-bottom: 72px; display: flex; align-items: center; justify-content: center; padding: 80px 40px; min-height: 200px; }
    .lab-mockup img { max-width: 100%; max-height: 520px; object-fit: contain; border-radius: 4px; }
    .lab-mockup-empty { color: rgba(255,255,255,0.2); font-family: var(--font-head); font-size: 0.8rem; letter-spacing: 2px; text-transform: uppercase; text-align: center; }
    .lab-section { margin-bottom: 56px; }
    .lab-section-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--gray-4); border-left: 2px solid var(--accent); padding-left: 12px; margin-bottom: 20px; }
    .lab-section-title { font-family: var(--font-head); font-size: 1.2rem; font-weight: 800; letter-spacing: -0.3px; margin-bottom: 12px; }
    .lab-p { font-size: 0.95rem; color: var(--gray-5); line-height: 1.8; margin-bottom: 12px; }
    .lab-p:last-child { margin-bottom: 0; }
    .feature-list { list-style: none; margin: 20px 0 0; display: flex; flex-direction: column; }
    .feature-list li { display: flex; align-items: flex-start; gap: 14px; padding: 16px 0; border-bottom: 1px solid var(--gray-2); font-size: 0.92rem; color: var(--gray-5); line-height: 1.6; }
    .feature-list li:first-child { border-top: 1px solid var(--gray-2); }
    .feature-icon { width: 28px; height: 28px; border-radius: 50%; background: var(--accent-hl); border: 1.5px solid var(--accent); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; flex-shrink: 0; margin-top: 1px; }
    .process-steps { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px; margin-top: 24px; }
    .process-step { background: var(--gray-1); padding: 24px 20px; }
    .process-step-num { font-size: 0.65rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); margin-bottom: 8px; }
    .process-step-title { font-family: var(--font-head); font-weight: 700; font-size: 0.9rem; margin-bottom: 6px; }
    .process-step-text { font-size: 0.8rem; color: var(--gray-5); line-height: 1.6; }
    .lab-callout { background: var(--gray-1); border-left: 3px solid var(--accent); padding: 20px 24px; margin: 24px 0; border-radius: 0 4px 4px 0; }
    .lab-callout p { font-size: 0.98rem; font-style: italic; color: var(--black); line-height: 1.7; margin: 0; font-family: var(--font-head); font-weight: 600; }
    .lab-live-btn { display: inline-flex; align-items: center; gap: 10px; padding: 16px 28px; background: var(--accent); color: var(--white); border-radius: 100px; font-family: var(--font-head); font-weight: 700; font-size: 0.9rem; text-decoration: none; transition: opacity 0.2s; }
    .lab-live-btn:hover { opacity: 0.75; }
    .lab-tools { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
    .lab-tool-pill { font-size: 0.78rem; font-weight: 600; color: var(--gray-5); background: var(--gray-1); border: 1px solid var(--gray-2); padding: 6px 14px; border-radius: 100px; }
    .back-btn { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-head); font-size: 0.85rem; font-weight: 700; color: var(--accent); text-decoration: none; border: 1.5px solid var(--accent); border-radius: 100px; padding: 12px 24px; transition: background 0.2s, color 0.2s; }
    .back-btn:hover { background: var(--accent); color: var(--white); }
    .btn-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 56px; }
    @media (max-width: 768px) {
      .lab-wrap { padding: 60px 24px 80px; }
      .process-steps { grid-template-columns: 1fr; }
      .lab-mockup { padding: 32px 24px; }
    }
  </style>
  <!-- Microsoft Clarity -->
  <script type="text/javascript">(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","vr81tuyrxt");</script>
</head>
<body>

  <nav class="nav" id="nav">
    <a href="index.html" class="nav-logo">Lab Unknown<span class="nav-dot" style="color:#FF5C00">.</span></a>
    <span style="font-size:0.62rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--gray-4);border:1px solid var(--gray-2);padding:3px 10px;border-radius:100px;margin-left:10px;">AI-enabled</span>
    <button class="nav-hamburger" id="navHamburger" aria-label="Toggle menu">
      <span></span><span></span><span></span>
    </button>
    <div class="nav-right">
      <a href="work.html"    class="nav-link">Work</a>
      <a href="lab.html"     class="nav-link active">Lab</a>
      <a href="about.html"   class="nav-link">About</a>
      <a href="contact.html" class="nav-link">Contact</a>
      <div class="nav-badge"><span class="dot"></span>Available</div>
    </div>
  </nav>

  <div class="page">
    <div class="lab-wrap fade-in">

      <nav class="lab-breadcrumb">
        <a href="index.html">Home</a><span>›</span>
        <a href="lab.html">Lab</a><span>›</span>
        <span>${esc(title)}</span>
      </nav>

      ${statusBadge}
      <div><span class="lab-tag">${esc(tags || '')}</span></div>

      <h1 class="lab-title">${esc(title)}</h1>
      <p class="lab-subtitle">${esc(tagline || '')}</p>

      <div class="lab-mockup">
        <p class="lab-mockup-empty">Add a screenshot to img/Lab/ folder and update the src below</p>
      </div>

      ${sectionsHTML}
      ${processHTML}
      ${featuresHTML}

      <div class="btn-row">
        ${liveBtn}
        <a href="lab.html" class="back-btn">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M12 7H2M6 3L2 7l4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Back to Lab
        </a>
      </div>

      ${toolsHTML}

    </div>
  </div>

  <footer class="footer">
    <span class="footer-copy">© ${year} Lab Unknown. All rights reserved.</span>
    <p class="footer-built">Vibe coded with <a href="https://claude.ai" target="_blank" rel="noopener">Claude</a> and <a href="https://netlify.com" target="_blank" rel="noopener">Netlify</a>. <a href="process.html">Learn more →</a></p>
  </footer>

  <script>
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => { nav.classList.toggle('scrolled', window.scrollY > 20); });
    const hamburger = document.getElementById('navHamburger');
    const navRight = document.querySelector('.nav-right');
    if (hamburger) {
      hamburger.addEventListener('click', () => {
        navRight.classList.toggle('open');
        hamburger.classList.toggle('open');
      });
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  </script>

</body>
</html>`;
}

function updateLabIndex(data, slug, filename) {
  const labPath = path.join(LAB_DIR, 'lab.html');
  let html = fs.readFileSync(labPath, 'utf8');

  // Count existing items
  const existingItems = (html.match(/class="acc-item/g) || []).length;
  const num = String(existingItems + 1).padStart(2, '0');
  const year = new Date().getFullYear();

  // Build data-cat from tags
  const cats = (data.tags || '').toLowerCase()
    .replace(/[·•,]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/).filter(Boolean).slice(0, 4).join(' ');

  const statusBadge = data.status === 'live'
    ? `<span class="acc-live"><span class="acc-live-dot"></span>Live</span>`
    : `<span class="acc-inprogress"><span class="status-dot"></span>In Progress</span>`;

  const newItem = `
        <!-- ${num}: ${data.title} — from Dashboard -->
        <div class="acc-item fade-in" data-cat="${cats || 'ai'}">
          <button class="acc-trigger" aria-expanded="false">
            <div class="acc-left">
              <span class="acc-num">${num}</span>
              <div class="acc-meta">
                <span class="acc-name">${esc(data.title)}</span>
                <span class="acc-cat">${esc(data.tags || '')}</span>
              </div>
            </div>
            <div class="acc-right">
              ${statusBadge}
              <span class="acc-year">${year}</span>
              <span class="acc-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </span>
            </div>
          </button>
          <div class="acc-body" id="acc-${slug}">
            <div class="acc-content">
              <p class="acc-desc">${esc(data.tagline || data.title)}</p>
              <a href="${filename}" class="acc-link">View Case Study →</a>
            </div>
          </div>
        </div>`;

  // Insert before the closing </div> of .work-accordion
  const marker = '</div>\n\n    </section>';
  if (html.includes(marker)) {
    html = html.replace(marker, newItem + '\n\n      </div>\n\n    </section>');
  } else {
    // Fallback: insert before </section>
    html = html.replace('</section>', newItem + '\n\n    </section>');
  }

  fs.writeFileSync(labPath, html);
}

// GET: check if Lab Unknown folder is accessible
router.get('/status', (req, res) => {
  const accessible = fs.existsSync(LAB_DIR);
  res.json({ accessible, dir: LAB_DIR });
});

// POST: generate and save case study
router.post('/', (req, res) => {
  try {
    const { title } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

    const slug = req.body.slug || generateSlug(title);
    const filename = `lab-${slug}.html`;
    const filepath = path.join(LAB_DIR, filename);

    if (!fs.existsSync(LAB_DIR)) {
      return res.status(500).json({ error: `Lab Unknown folder not found: ${LAB_DIR}` });
    }

    const html = generateHTML({ ...req.body, slug });
    fs.writeFileSync(filepath, html, 'utf8');

    updateLabIndex(req.body, slug, filename);

    res.json({ success: true, filename, filepath });
  } catch (err) {
    console.error('Case study error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Helpers for conversation extraction ──────────────────────────────────────

/** Extract plain text from a single JSONL line object */
function extractText(obj) {
  // User message: message.content is a string
  if (obj.type === 'user' && obj.message) {
    const c = obj.message.content;
    if (typeof c === 'string') return { role: 'user', text: c };
    if (Array.isArray(c)) {
      const t = c.filter(x => x.type === 'text').map(x => x.text).join(' ');
      return t ? { role: 'user', text: t } : null;
    }
  }
  // Assistant message: message.content is array
  if (obj.type === 'assistant' && obj.message) {
    const c = obj.message.content;
    if (Array.isArray(c)) {
      const t = c.filter(x => x.type === 'text').map(x => x.text).join(' ');
      return t ? { role: 'assistant', text: t } : null;
    }
    if (typeof c === 'string') return { role: 'assistant', text: c };
  }
  return null;
}

/** Read a JSONL session file and return last N readable messages */
function readSessionMessages(filePath, maxMessages = 60) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  const messages = [];
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      const msg = extractText(obj);
      if (msg && msg.text.trim().length > 10) messages.push(msg);
    } catch { /* skip malformed lines */ }
  }
  return messages.slice(-maxMessages);
}

/** Call the claude CLI with a prompt, returns stdout string */
function callClaude(prompt, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Claude CLI timed out after 2 minutes'));
    }, timeoutMs);

    // Write prompt to temp file to avoid any shell escaping / length issues
    const tmpFile = path.join(os.tmpdir(), `cs-gen-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, prompt, 'utf8');

    // On Windows cmd.exe supports stdin redirect with <
    const isWin = process.platform === 'win32';
    const cmd   = `claude -p < "${tmpFile}"`;

    const child = spawn(cmd, [], {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });

    child.on('close', code => {
      clearTimeout(timer);
      try { fs.unlinkSync(tmpFile); } catch {}
      if (code !== 0) return reject(new Error(`Claude CLI exited ${code}: ${stderr.slice(0, 300)}`));
      resolve(stdout.trim());
    });

    child.on('error', err => {
      clearTimeout(timer);
      try { fs.unlinkSync(tmpFile); } catch {}
      reject(err);
    });
  });
}

// ── POST /api/case-study/generate ────────────────────────────────────────────

router.post('/generate', async (req, res) => {
  try {
    const { project } = req.body;
    // project: { id, name, description, sessions: [{path, name}] }
    if (!project?.name) return res.status(400).json({ error: 'Project data required' });

    // 1. Read conversation history from linked sessions
    let conversationBlocks = [];
    for (const session of (project.sessions || [])) {
      const messages = readSessionMessages(session.path, 60);
      if (messages.length === 0) continue;

      let block = `\n=== Session: "${session.name}" ===\n`;
      for (const m of messages) {
        // Truncate very long messages (code dumps etc.) to keep prompt lean
        const text = m.text.length > 600
          ? m.text.slice(0, 600) + '…'
          : m.text;
        block += `\n${m.role === 'user' ? 'Miyoung' : 'Claude'}: ${text}`;
      }
      conversationBlocks.push(block);
    }

    const conversationContext = conversationBlocks.length > 0
      ? conversationBlocks.join('\n\n')
      : '(No conversation history available — generate based on project name and description only)';

    // 2. Build the generation prompt
    const prompt = `You are writing a case study for Lab Unknown (labunknown.ca), a design and AI portfolio by Miyoung Cho.

WRITING STYLE RULES:
- First person, honest and reflective (Miyoung's voice)
- Conversational but professional — like a real project reflection, not corporate speak
- Focus on the WHY and LEARNINGS, not just the what
- Short paragraphs (3-4 sentences max)
- Each section needs a punchy, specific headline (not generic like "About this project")
- Tone examples from the site: "A pointless but delightful web experiment", "It started with a cigarette", "Two AI tools, one deployment pipeline, zero traditional coding"

PROJECT INFO:
Name: ${project.name}
Description: ${project.description || 'No description provided'}

CONVERSATION HISTORY (from Claude Code dev sessions):
${conversationContext}

TASK:
Based on the above, generate a complete case study. Output ONLY a valid JSON object with this exact structure (no markdown, no explanation, just raw JSON):

{
  "tagline": "one compelling sentence — what it is and why it matters, in Miyoung's voice",
  "tags": "Tag1 · Tag2 · Tag3",
  "tools": ["Tool1", "Tool2", "Tool3"],
  "sections": [
    {
      "label": "The Origin",
      "title": "Specific punchy headline about WHY this was made",
      "body": "Paragraph 1 (3-4 sentences about the origin/motivation)\\n\\nParagraph 2 (the context or the spark moment)",
      "callout": "One memorable quote or insight from the process (or empty string)"
    },
    {
      "label": "How It Was Built",
      "title": "Specific headline about the build approach",
      "body": "Paragraph about technical approach and decisions\\n\\nParagraph about what was interesting/challenging"
    }
  ],
  "processSteps": [
    {"title": "Step title", "text": "1-2 sentence description"},
    {"title": "Step title", "text": "1-2 sentence description"},
    {"title": "Step title", "text": "1-2 sentence description"},
    {"title": "Step title", "text": "1-2 sentence description"}
  ],
  "features": [
    {"title": "Feature name", "text": "brief description of what it does"},
    {"title": "Feature name", "text": "brief description"}
  ]
}

Output ONLY the JSON. Nothing else.`;

    // 3. Call Claude CLI
    const raw = await callClaude(prompt);

    // 4. Extract JSON from response (Claude might wrap it in backticks)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({
        error: 'Claude did not return valid JSON',
        raw: raw.slice(0, 500),
      });
    }

    const data = JSON.parse(jsonMatch[0]);
    res.json({ success: true, data });

  } catch (err) {
    console.error('Generate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
