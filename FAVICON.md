# Favicon Generation

## How to Regenerate Favicons

If you update the `public/icon.png` logo, regenerate all favicon variants by running:

```bash
npm run generate-favicons
```

This will create:
- `favicon.ico` (32x32) - Browser tab icon
- `icon-192.png` (192x192) - PWA icon (small)
- `icon-512.png` (512x512) - PWA icon (large)
- `apple-touch-icon.png` (180x180) - iOS home screen icon

## Manual Generation

Alternatively, run the script directly:

```bash
node scripts/generate-favicons.mjs
```

All favicon files are automatically referenced in:
- `app/layout.tsx` (favicon, apple-touch-icon)
- `public/manifest.json` (PWA icons)
