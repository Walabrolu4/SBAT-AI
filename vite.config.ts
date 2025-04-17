// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  // Define the public directory (where assets like images are served from)
  publicDir: 'public',
  build: {
    // Output directory for production builds (not needed for dev server)
    outDir: 'dist'
  },
  server: {
    // Optional: Specify port for the dev server
    port: 8080,
    // Optional: Automatically open browser when server starts
    open: true
  }
});