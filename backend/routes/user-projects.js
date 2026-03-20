import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../../data/user-projects.json');

function readProjects() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeProjects(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET all user projects
router.get('/', (req, res) => {
  res.json(readProjects());
});

// POST create project
router.post('/', (req, res) => {
  const { name, description, color, status } = req.body;
  const projects = readProjects();
  const newProject = {
    id: crypto.randomUUID(),
    name: name?.trim() || 'New Project',
    description: description?.trim() || '',
    color: color || '#7c5cbf',
    status: status || 'active',
    sessions: [],
    createdAt: new Date().toISOString(),
  };
  projects.push(newProject);
  writeProjects(projects);
  res.json(newProject);
});

// PUT update project
router.put('/:id', (req, res) => {
  const projects = readProjects();
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { name, description, color, status } = req.body;
  projects[idx] = {
    ...projects[idx],
    ...(name !== undefined && { name: name.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(color !== undefined && { color }),
    ...(status !== undefined && { status }),
  };
  writeProjects(projects);
  res.json(projects[idx]);
});

// DELETE project
router.delete('/:id', (req, res) => {
  let projects = readProjects();
  projects = projects.filter(p => p.id !== req.params.id);
  writeProjects(projects);
  res.json({ ok: true });
});

// POST add session to project
router.post('/:id/sessions', (req, res) => {
  const { sessionPath, sessionName } = req.body;
  const projects = readProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  if (!project.sessions.find(s => s.path === sessionPath)) {
    project.sessions.push({ path: sessionPath, name: sessionName });
  }
  writeProjects(projects);
  res.json(project);
});

// DELETE remove session from project
router.delete('/:id/sessions', (req, res) => {
  const { sessionPath } = req.body;
  const projects = readProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  project.sessions = project.sessions.filter(s => s.path !== sessionPath);
  writeProjects(projects);
  res.json(project);
});

export default router;
