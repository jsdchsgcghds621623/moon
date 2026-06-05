/**
 * This is the base config for vite.
 * When building, the adapter config is used which loads this file and extends it.
 */
import { defineConfig, type UserConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

/**
 * Note that Vite normally starts from `index.html` but the qwikCity plugin makes start at `src/entry.ssr.tsx` instead.
 */
export default defineConfig((): UserConfig => {
  return {
    plugins: [qwikCity(), qwikVite(), tsconfigPaths()],
    // This tells Vite which dependencies to pre-bundle in dev mode.
    optimizeDeps: {
      // Put problematic deps that break bundling here, for example:
      // include: ["react", "react-dom"],
      exclude: [],
    },
    /**
     * This is an advanced setting. It improves the bundling of your server code. To use it you must understand when your consumed libraries are dependencies or dev dependencies. (otherwise things will break in production)
     */
    // ssr: {
    //   external: ["@builder.io/qwik-city"],
    // },
    server: {
      headers: {
        // Don't cache the server response in dev mode
        'Cache-Control': 'public, max-age=0',
      },
    },
    preview: {
      headers: {
        // Do cache the server response in preview (non-adapter production build)
        'Cache-Control': 'public, max-age=600',
      },
    },
  };
});