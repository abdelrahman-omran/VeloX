/**
 * VeloX Tailwind theme extension.
 * Merge into theme.extend of your tailwind.config.{js,ts}:
 *
 *   const veloxExtend = require('./docs/brand/tailwind.velox.extend.js')
 *   // or copy the `extend` object after scaffolding frontend/
 *
 * Requires darkMode: 'class' (or always-dark root with class="dark").
 * Fonts: load Geist + JetBrains Mono in the app entry / index.html.
 */

module.exports = {
  colors: {
    velox: {
      bg: '#0B0E14',
      card: '#131820',
      elevated: '#1A212C',
      border: '#243041',
      text: '#E8EEF6',
      muted: '#8B97A8',
      brand: '#4C8BF5',
      hover: '#6BA0F7',
      soft: 'rgba(76, 139, 245, 0.12)',
      low: '#3D9B74',
      med: '#D19A26',
      high: '#E24B4A',
    },
  },
  fontFamily: {
    sans: ['Geist', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
};
