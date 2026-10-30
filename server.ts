import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { diagnoseCode, generateRoadmap } from './src/server/geminiService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '2mb' }));

app.post('/api/diagnose', async (req, res) => {
  try {
    const result = await diagnoseCode(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('API /api/diagnose error:', error);
    res.status(500).json({ error: error?.message || 'Internal error in diagnose' });
  }
});

app.post('/api/roadmap', async (req, res) => {
  try {
    const result = await generateRoadmap(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('API /api/roadmap error:', error);
    res.status(500).json({ error: error?.message || 'Internal error in roadmap' });
  }
});

// Serve frontend dist assets in production
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`DevMentor AI server running on port ${PORT}`);
});
