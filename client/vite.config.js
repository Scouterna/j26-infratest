import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const resolveBasePath = (command) => {
  const fromEnv = process.env.VITE_BASE_PATH
  if (fromEnv) {
    return fromEnv.endsWith('/') ? fromEnv : `${fromEnv}/`
  }

  // Relative base keeps the built assets working when the app is mounted under any prefix.
  return command === 'build' ? './' : '/'
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  base: resolveBasePath(command),
  plugins: [react()],
  server: {
    // Proxy API requests to the backend server during development
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // Your FastAPI backend
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://127.0.0.1:8000', // Your FastAPI backend
        changeOrigin: true,
      },
    },
  },
}))
