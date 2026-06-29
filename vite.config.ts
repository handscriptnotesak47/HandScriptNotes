import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

// Automatically generate static icons in the public folder on configuration loading
try {
  const publicDir = path.resolve(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  const BASE64_PNG_FAVICON = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAADwUlEQVR4nO2bXWgcVRTHf+fObrbZpE0XW9I+pGKLpkoofbB96ZMoKKgY8UFEfBAffPBBUB988UUE9UEDgqh906KIKCg++CD4Igo+CEp9UMREfSgKNSZ9sE0bN5v9uDdn9mYns7O7s5PdmTvzB8PMZOfcc+/vnnv/58zdq6pijfL4bC+vOaAArDmgAKw5oACsOaAAfN8Z8Atf0KjWeasD/P8D8vjLwBvX/48G+7nN+Gscf/AALxsc4E0H+N96Dpgf7OdVv/KGD/h4fICvO8AbmXb8Nf4z8PDoAI8bHODNB/jffg7I4y+DNfDwyYUDPG89v5Xp3fGgD/gIeGR6gI0G+1nHr8b/XofP9vGSz7gC/NApID79XODR6QE2GuyG0y7Z8at+9hBvD87ykS+4DDxsFFAd6bSOfbEOn/uUR8CD+6byG866bMc/xreH9pED/A7ssQrInXbRjn/K8XfT3Wv8u0vL0Y6/m5L69HnIInSNo6/xVzm+mO7+HofYwYpX/Z0OnyvArKNAv9MRZ/hL5V/N2K6N9S1g3FFgoT1WAVZ78/l6536XjWzWjVpHPW6669Y5/h5GvNo87fB9T0csAnvshvNpx//D4feXlqOOW6fPMWf4exnyajvT4fsZsBfssQ7IK6c82z5vRzt9H8W2I+V2ZfIcsN9m/bKOP1yOnz9CunscYgfZXn2OWZfN7bVl2m669Y7/OOMvsUf9pUP8PuxRx6+g7Tz+M0Z/b9W7BfT6gD3pI+B+n98Z98W+S+7g6Yw/vD0qgD2V8YfH8Z8Anu877v7b4g6eqeNXM+Z1p8N6zvgDPHh/8gC7fO4IuIeN9nNdfnE08fN19zVGrvGvOf63fNfD19zH/9Ppxr6Bv0wZ8PAt9/p9Ygqg44+7fP4MvAs81CrA6P6I/7q6n47/nNHzK7uO31H3G/86/lNGz8m9dPwNfL/Z9eWUX3Z6uR3/M0bPsc3/A9zXLOF7M/v/vH8v3Y+W9u+A3dfXW47fs/Nfx3/Z9Ld3Y5HffvY6f92/68vU/bM8Z8YVbWv8Ffc7+yU6/hSjz7/u6u04t6vOf96b7sP9f9m+j5bK/z3U8WvXbXb8pYye93sH/v/A7mva8TfWv8p/CzzXvD8M3MvG/j1Uf3t/e3f/f+E1BxSANQcUgDUHFIA1BxSANQcUgPUv+B7uE+0Yy/0AAAAASUVORK5CYII=";
  const buffer = Buffer.from(BASE64_PNG_FAVICON, 'base64');
  
  const iconFiles = [
    'favicon-16x16.png',
    'favicon-32x32.png',
    'favicon-48x48.png',
    'apple-touch-icon.png',
    'favicon-192x192.png',
    'favicon-512x512.png',
    'favicon.ico'
  ];
  
  iconFiles.forEach(file => {
    const filePath = path.join(publicDir, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, buffer);
    }
  });

  // Copy notes_db.json to public/api/notes_db.json for PHP integration
  const apiDir = path.resolve(__dirname, 'public', 'api');
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }
  const sourceNotesDb = path.resolve(__dirname, 'notes_db.json');
  const targetNotesDb = path.resolve(apiDir, 'notes_db.json');
  if (fs.existsSync(sourceNotesDb)) {
    fs.copyFileSync(sourceNotesDb, targetNotesDb);
  }
} catch (e) {
  console.error('Failed to pre-generate static icons or copy notes database:', e);
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
