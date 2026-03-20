import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env를 명시적 경로로 로드
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import weatherRouter from './routes/weather.js';
import projectsRouter from './routes/projects.js';
import scheduleRouter from './routes/schedule.js';
import summaryRouter from './routes/summary.js';
import userProjectsRouter from './routes/user-projects.js';
import caseStudyRouter from './routes/casestudy.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/weather', weatherRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/summary', summaryRouter);
app.use('/api/user-projects', userProjectsRouter);
app.use('/api/case-study', caseStudyRouter);

// Open URL in default browser
app.post('/api/open-url', (req, res) => {
  const { url } = req.body;
  if (!url || !url.startsWith('https://')) return res.status(400).json({ error: 'Invalid URL' });
  exec(`start "" "${url}"`);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Morning Dashboard backend running on http://localhost:${PORT}`);
});
