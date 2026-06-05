import { defineConfig } from '@builder.io/qwik/optimizer';

export default defineConfig({
  eslintConfig: {
    rules: {
      'no-console': 'warn',
    },
  },
  ssr: {
    include: ['**/app/**'],
  },
});