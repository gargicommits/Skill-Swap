import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { initDatabase } from './server/db.js';
import { authRouter } from './server/routes/authRoutes.js';
import { seniorRouter } from './server/routes/seniorRoutes.js';
import { learningRouter } from './server/routes/learningRoutes.js';
import { creditRouter } from './server/routes/creditRoutes.js';
import { adminRouter } from './server/routes/adminRoutes.js';
import { notificationRouter } from './server/routes/notificationRoutes.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Initialize Relational Database
  initDatabase();
  console.log('Skill Swap Buddy Relational Database initialized successfully.');

  // Middleware
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Request logger for security monitoring
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path} - ${new Date().toISOString()}`);
    }
    next();
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      system: 'Skill Swap Buddy System - College Peer-Learning Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/seniors', seniorRouter);
  app.use('/api/learning', learningRouter);
  app.use('/api/credits', creditRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/notifications', notificationRouter);

  // 404 handler for API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });

  // Error handling middleware for API
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled API Error:', err);
    res.status(500).json({
      error: 'An internal server error occurred. Please contact college platform admin.',
    });
  });

  // Helper to locate static dist directory containing index.html
  function getDistPath(): string | null {
    const candidates = [
      path.resolve(process.cwd(), 'dist'),
      typeof __dirname !== 'undefined' ? __dirname : null,
      typeof __dirname !== 'undefined' ? path.resolve(__dirname, '..', 'dist') : null,
    ].filter(Boolean) as string[];

    for (const candidate of candidates) {
      if (fs.existsSync(path.join(candidate, 'index.html'))) {
        return candidate;
      }
    }
    return null;
  }

  // Production vs Development SPA Serving Setup
  const isBundled = typeof __filename !== 'undefined' && __filename.endsWith('.cjs');
  const distPath = getDistPath();
  const isProduction =
    (isBundled || process.env.NODE_ENV === 'production') &&
    process.env.NODE_ENV !== 'development' &&
    Boolean(distPath);

  if (isProduction && distPath) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` Skill Swap Buddy Server running on http://0.0.0.0:${PORT}`);
    console.log(` Security: RBAC, ERP Validation, SPPU 10-Subject Policy`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
