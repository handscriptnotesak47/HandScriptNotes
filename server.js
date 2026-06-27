// Root-level entry point for Node.js hosting providers (like Hostinger) that look for a root server.js file.
// This loads the compiled and bundled production server.
try {
  require('./dist/server.cjs');
} catch (error) {
  console.error('Error loading bundled server. Make sure "npm run build" has run successfully.');
  console.error(error);
  process.exit(1);
}
