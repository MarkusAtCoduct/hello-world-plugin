import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';


// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 50142,
  },
  plugins: [react(),
    tailwindcss(),
],
});
