import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import obfuscator from 'rollup-plugin-obfuscator';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Runs only during 'npm run build' so your dev server remains fast
      isProduction && obfuscator({
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        numbersToExpressions: true,
        simplify: true,
        stringArray: true,
        stringArrayThreshold: 0.8,
        splitStrings: true,
        splitStringsChunkLength: 5,
        transformObjectKeys: true,
        unicodeEscapeSequence: false
      })
    ].filter(Boolean),

    build: {
      // 1. Critical: Disable source maps so DevTools cannot inspect original source code
      sourcemap: false,

      // 2. Strip console logs, debugger statements, and comments
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug']
        },
        mangle: {
          toplevel: true
        },
        format: {
          comments: false // Strips all license headers and comments
        }
      },

      // 3. Scramble output file names into random hashes
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[hash].js',
          chunkFileNames: 'assets/[hash].js',
          assetFileNames: 'assets/[hash].[ext]'
        }
      }
    }
  };
});