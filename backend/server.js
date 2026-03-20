import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from explicit path
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import weatherRouter from './routes/weather.js';
import summaryRouter from './routes/summary.js';
import caseStudyRouter from './routes/casestudy.js';

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Railway health checks)
    if (!origin) return callback(null, true);
    // Allow any Netlify subdomain
    if (origin.endsWith('.netlify.app') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

app.use('/api/weather', weatherRouter);
app.use('/api/summary', summaryRouter);
app.use('/api/case-study', caseStudyRouter);

// Open URL in default browser (local only — no-op on Railway)
app.post('/api/open-url', (req, res) => {
  const { url } = req.body;
  if (!url || !url.startsWith('https://')) return res.status(400).json({ error: 'Invalid URL' });
  try {
    exec(`start "" "${url}"`);
  } catch {
    // Silently ignore — not supported in Railway environment
  }
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Morning Dashboard backend running on port ${PORT}`);
});
