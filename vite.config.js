export default {
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