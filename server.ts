import express from 'express';
import path from 'path';

async function startServer() {
  const app = express();
  // Hostinger typically injects PORT, fallback to 3000 for AI Studio environment
  const PORT = process.env.PORT || 3000;

  // JSON and URL-encoded parsers for any API requests
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API endpoints can be placed here
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Serve static files and handle routing depending on environment
  if (process.env.NODE_ENV !== 'production') {
    console.log('Running in DEVELOPMENT mode with Vite middleware');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Running in PRODUCTION mode; serving pre-built static assets');
    const distPath = path.join(process.cwd(), 'dist');
    
    // Serve static files from the build directory
    app.use(express.static(distPath));
    
    // Fallback all routes to index.html for Single Page Application routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
