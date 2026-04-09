export default {
  publicDir: 'assets',
  server: { port: 5173 },
  build: {
    rollupOptions: {
      external: ['electron']
    }
  },
  optimizeDeps: {
    exclude: ['electron']
  }
}