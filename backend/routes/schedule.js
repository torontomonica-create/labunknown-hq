import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../../data/schedule.json');

function readData() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET all schedule items
router.get('/', (req, res) => {
  res.json(readData());
});

// POST new item
router.post('/', (req, res) => {
  const items = readData();
  const item = {
    id: Date.now().toString(),
    text: req.body.text,
    date: req.body.date,
    time: req.body.time || null,
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  writeData(items);
  res.json(item);
});

// DELETE item
router.delete('/:id', (req, res) => {
  const items = readData().filter(i => i.id !== req.params.id);
  writeData(items);
  res.json({ ok: true });
});

export default router;
