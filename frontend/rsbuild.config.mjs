import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  dev: {
    historyApiFallback: true,
  },
  html: {
    title: 'Geochemical Modeling Gateway',
    favicon: 'assets/favicon.png',
  },
});
