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

// Claude 대화 JSONL에서 메시지 추출 (Claude Code 포맷)
function extractMessages(jsonlPath) {
  const content = fs.readFileSync(jsonlPath, 'utf8');
  const lines = content.trim().split('\n').filter(Boolean);
  const messages = [];

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      // queue-operation 등 제외, user/assistant 타입만
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

// Git summary
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

// 로컬 폴더 최근 파일
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

// POST /api/summary
router.post('/', async (req, res) => {
  const { type, projectPath, conversationId } = req.body;

  // Git/로컬은 API 없이 처리
  if (type === 'git') {
    const data = getGitSummary(projectPath);
    if (!data) return res.json({ summary: '커밋 정보를 가져올 수 없습니다.' });

    return res.json({
      lines: [
        { label: '최근 커밋', content: data.log },
        data.diff ? { label: '변경 파일', content: data.diff } : null,
      ].filter(Boolean),
    });
  }

  if (type === 'local') {
    const data = getLocalSummary(projectPath);
    if (!data) return res.json({ summary: '폴더 정보를 가져올 수 없습니다.' });

    const fileList = data.files
      .map(f => {
        const age = Math.round((Date.now() - f.mtime) / (1000 * 60 * 60 * 24));
        return `${f.isDir ? '📁' : '📄'} ${f.name}  (${age === 0 ? '오늘' : age + '일 전'})`;
      })
      .join('\n');

    return res.json({
      lines: [{ label: '최근 수정 파일', content: fileList }],
    });
  }

  // Claude 대화 — 마지막 대화 원문 표시
  if (type === 'claude') {
    let messages;
    try {
      messages = extractMessages(projectPath);
    } catch {
      return res.json({ lines: [{ label: '오류', content: '대화 파일을 읽을 수 없습니다.' }] });
    }

    if (messages.length === 0) {
      return res.json({ lines: [{ label: '내용 없음', content: '대화 내용이 없습니다.' }] });
    }

    const recent = messages.slice(-6);
    const formatted = recent
      .map(m => {
        const who = m.role === 'user' ? '👤 James' : '🤖 Claude';
        const text = m.text.length > 300 ? m.text.slice(0, 300) + '...' : m.text;
        return `${who}\n${text}`;
      })
      .join('\n\n─────────────────\n\n');

    return res.json({
      lines: [
        { label: `마지막 대화 (${messages.length}개 중 최근 ${Math.min(6, messages.length)}개)`, content: formatted },
      ],
    });
  }

  res.status(400).json({ lines: [{ label: '오류', content: '알 수 없는 타입입니다.' }] });
});

export default router;
