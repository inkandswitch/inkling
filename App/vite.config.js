import { defineConfig } from "vite"

export default defineConfig({
  server: {
    host: true
  },
  build: {
    minify: false,
    cssMinify: false,
    target: "esnext"
  }
})
