import express from 'express';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();

function getAnthropicClient() {
  const key = process.env.DASHBOARD_AI_KEY;
  if (!key || key === 'your_api_key_here') return null;
  return new Anthropic({ apiKey: key });
}

// ── Local-only helpers (skipped when paths don't exist) ──────────────────────

function extractMessages(jsonlPath) {
  const content = fs.readFileSync(jsonlPath, 'utf8');
  const lines = content.trim().split('\n').filter(Boolean);
  const messages = [];

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.type !== 'user' && entry.type !== 'assistant') continue;

      const msgContent = entry.message?.content;
      if (!msgContent) continue;

      let text = '';
      if (typeof msgContent === 'string') {
        text = msgContent;
      } else if (Array.isArray(msgContent)) {
        text = msgContent
          .filter(p => p.type === 'text')
          .map(p => p.text)
          .join(' ');
      }

      if (text.trim().length > 3) {
        messages.push({ role: entry.type, text: text.trim() });
      }
    } catch {
      continue;
    }
  }
  return messages;
}

function getGitSummary(repoPath) {
  try {
    const log = execSync(
      'git log --oneline -10',
      { cwd: repoPath, timeout: 3000 }
    ).toString().trim();

    const diff = execSync(
      'git diff --stat HEAD~3 HEAD 2>/dev/null || git diff --stat HEAD 2>/dev/null || echo ""',
      { cwd: repoPath, timeout: 3000 }
    ).toString().trim();

    return { type: 'git', log, diff };
  } catch {
    return null;
  }
}

function getLocalSummary(folderPath) {
  try {
    const files = [];
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const fullPath = path.join(folderPath, e.name);
      try {
        const stat = fs.statSync(fullPath);
        files.push({ name: e.name, mtime: stat.mtime, isDir: e.isDirectory() });
      } catch { continue; }
    }
    files.sort((a, b) => b.mtime - a.mtime);
    return { type: 'local', files: files.slice(0, 10) };
  } catch {
    return null;
  }
}

// ── POST /api/summary ────────────────────────────────────────────────────────
// Two modes:
//   1. Production (Railway): { text, projectName } → Claude API summary
//   2. Local fallback: { type, projectPath, conversationId } → read local files

router.post('/', async (req, res) => {
  const { type, projectPath, conversationId, text, projectName } = req.body;

  // ── Mode 1: Production — generate summary via Claude API ──────────────────
  if (text !== undefined || (projectName && !type && !projectPath)) {
    const client = getAnthropicClient();
    if (!client) {
      return res.json({ summary: 'AI summary unavailable — API key not configured.' });
    }

    try {
      const prompt = projectName
        ? `Give a brief 2-3 sentence summary and one actionable suggestion for this project:\n\nProject: ${projectName}\n\n${text || ''}`
        : `Give a brief 2-3 sentence summary and one actionable suggestion based on this:\n\n${text}`;

      const message = await client.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      });

      const summary = message.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('');

      return res.json({ summary });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── Mode 2: Local fallback — only runs when path exists ──────────────────

  // Git summary
  if (type === 'git') {
    if (projectPath && !fs.existsSync(projectPath)) {
      return res.json({ summary: 'Project folder not found on this machine.' });
    }
    const data = getGitSummary(projectPath);
    if (!data) return res.json({ summary: 'Could not read git history.' });

    return res.json({
      lines: [
        { label: 'Recent commits', content: data.log },
        data.diff ? { label: 'Changed files', content: data.diff } : null,
      ].filter(Boolean),
    });
  }

  // Local folder summary
  if (type === 'local') {
    if (projectPath && !fs.existsSync(projectPath)) {
      return res.json({ summary: 'Project folder not found on this machine.' });
    }
    const data = getLocalSummary(projectPath);
    if (!data) return res.json({ summary: 'Could not read folder.' });

    const fileList = data.files
      .map(f => {
        const age = Math.round((Date.now() - f.mtime) / (1000 * 60 * 60 * 24));
        return `${f.isDir ? '[dir]' : '[file]'} ${f.name}  (${age === 0 ? 'today' : age + 'd ago'})`;
      })
      .join('\n');

    return res.json({
      lines: [{ label: 'Recently modified files', content: fileList }],
    });
  }

  // Claude JSONL conversation — local only
  if (type === 'claude') {
    if (projectPath && !fs.existsSync(projectPath)) {
      return res.json({ lines: [{ label: 'Unavailable', content: 'Conversation file not found on this machine.' }] });
    }

    let messages;
    try {
      messages = extractMessages(projectPath);
    } catch {
      return res.json({ lines: [{ label: 'Error', content: 'Could not read conversation file.' }] });
    }

    if (messages.length === 0) {
      return res.json({ lines: [{ label: 'Empty', content: 'No conversation content found.' }] });
    }

    const recent = messages.slice(-6);
    const formatted = recent
      .map(m => {
        const who = m.role === 'user' ? 'James' : 'Claude';
        const text = m.text.length > 300 ? m.text.slice(0, 300) + '...' : m.text;
        return `${who}\n${text}`;
      })
      .join('\n\n─────────────────\n\n');

    return res.json({
      lines: [
        { label: `Last conversation (${Math.min(6, messages.length)} of ${messages.length})`, content: formatted },
      ],
    });
  }

  res.status(400).json({ lines: [{ label: 'Error', content: 'Unknown summary type.' }] });
});

export default router;
