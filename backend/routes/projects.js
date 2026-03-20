import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TASKS_FILE = path.join(__dirname, '../../data/tasks.json');

const CLAUDE_PROJECTS_DIR = 'C:/Users/jmy97/.claude/projects';

function readTasks() {
  if (!fs.existsSync(TASKS_FILE)) return {};
  return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
}

function writeTasks(data) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2));
}

// Claude Code sessions scan
function findClaudeConversations() {
  const conversations = [];
  if (!fs.existsSync(CLAUDE_PROJECTS_DIR)) return conversations;

  let projectDirs;
  try {
    projectDirs = fs.readdirSync(CLAUDE_PROJECTS_DIR, { withFileTypes: true })
      .filter(e => e.isDirectory());
  } catch {
    return conversations;
  }

  for (const dir of projectDirs) {
    const projectPath = path.join(CLAUDE_PROJECTS_DIR, dir.name);
    let files;
    try {
      files = fs.readdirSync(projectPath).filter(f => f.endsWith('.jsonl'));
    } catch {
      continue;
    }

    // Most recent conversation file per project
    const recentFile = files
      .map(f => ({ f, mtime: fs.statSync(path.join(projectPath, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)[0];

    if (!recentFile) continue;

    const filePath = path.join(projectPath, recentFile.f);
    try {
      const stat = fs.statSync(filePath);
      const daysSince = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60 * 24);
      if (daysSince > 60) continue;

      // Extract last user message as preview
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      let summary = null;

      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const msg = JSON.parse(lines[i]);
          if (msg.type === 'user') {
            const msgContent = msg.message?.content;
            if (typeof msgContent === 'string' && msgContent.length > 5) {
              summary = msgContent.slice(0, 100).replace(/\n/g, ' ');
              break;
            }
            if (Array.isArray(msgContent)) {
              const textPart = msgContent.find(p => p.type === 'text');
              if (textPart?.text?.length > 5) {
                summary = textPart.text.slice(0, 100).replace(/\n/g, ' ');
                break;
              }
            }
          }
        } catch {
          continue;
        }
      }

      // Convert folder name to readable project name
      const projectName = dir.name
        .replace(/^C--Users-jmy97-/, '')
        .replace(/--/g, ' / ')
        .replace(/-/g, ' ')
        || dir.name;

      conversations.push({
        type: 'claude',
        name: projectName,
        path: filePath,
        lastActivity: stat.mtime.toISOString(),
        lastMessage: summary,
        conversationId: recentFile.f.replace('.jsonl', ''),
      });
    } catch {
      continue;
    }
  }
  return conversations;
}

// GET all Claude Code projects
router.get('/', (req, res) => {
  const tasks = readTasks();
  const today = new Date().toDateString();

  const todayDeferred = tasks.todayDeferred?.[today] || [];
  const completed = tasks.completed || [];

  const claudeConvos = findClaudeConversations()
    .filter(p => !completed.includes(p.path))
    .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

  const result = claudeConvos.map(p => ({
    ...p,
    deferredToday: todayDeferred.includes(p.path),
  }));

  res.json(result);
});

// POST defer today
router.post('/defer', (req, res) => {
  const { projectPath } = req.body;
  const tasks = readTasks();
  const today = new Date().toDateString();

  if (!tasks.todayDeferred) tasks.todayDeferred = {};
  if (!tasks.todayDeferred[today]) tasks.todayDeferred[today] = [];

  if (!tasks.todayDeferred[today].includes(projectPath)) {
    tasks.todayDeferred[today].push(projectPath);
  }
  writeTasks(tasks);
  res.json({ ok: true });
});

// POST undefer
router.post('/undefer', (req, res) => {
  const { projectPath } = req.body;
  const tasks = readTasks();
  const today = new Date().toDateString();

  if (tasks.todayDeferred?.[today]) {
    tasks.todayDeferred[today] = tasks.todayDeferred[today].filter(p => p !== projectPath);
  }
  writeTasks(tasks);
  res.json({ ok: true });
});

// POST complete
router.post('/complete', (req, res) => {
  const { projectPath } = req.body;
  const tasks = readTasks();
  if (!tasks.completed) tasks.completed = [];
  if (!tasks.completed.includes(projectPath)) {
    tasks.completed.push(projectPath);
  }
  writeTasks(tasks);
  res.json({ ok: true });
});

// POST uncomplete
router.post('/uncomplete', (req, res) => {
  const { projectPath } = req.body;
  const tasks = readTasks();
  if (tasks.completed) {
    tasks.completed = tasks.completed.filter(p => p !== projectPath);
  }
  writeTasks(tasks);
  res.json({ ok: true });
});

export default router;
