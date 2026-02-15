# MD2PDF

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![GitHub Stars](https://img.shields.io/github/stars/Sterbweise/md2pdf?style=social)](https://github.com/Sterbweise/md2pdf/stargazers)
[![GitHub Repo Size](https://img.shields.io/github/repo-size/Sterbweise/md2pdf)](https://github.com/Sterbweise/md2pdf)

Modern Markdown and HTML to PDF converter with smart formatting and Notion export support. **100% free, open source, unlimited conversions.**

🔍 **SEO-optimized** for Google Search with comprehensive metadata, structured data, and keyword targeting.

## Features

- **Dual Mode** – Convert Markdown or HTML to PDF
- **Smart Page Breaks** – Intelligent layout to minimize white space
- **Notion Support** – Direct API import and nested ZIP export handling
- **Live Preview** – Real-time rendering as you type
- **Custom Formatting** – 11+ fonts, custom margins, line height, and footer text
- **File Import** – Drag & drop support for .md, .html, .txt, and .zip files
- **Dark Mode** – Full dark/light theme support
- **GitHub Flavored Markdown** – Tables, task lists, syntax highlighting
- **SEO Ready** – Pre-configured with robots.txt, sitemap.xml, Open Graph, and JSON-LD structured data

## Tech Stack

- Next.js 15 + TypeScript
- Tailwind CSS
- Puppeteer (PDF generation)
- React Markdown + GitHub Flavored Markdown

## Getting Started

### Local Development

```bash
git clone https://github.com/Sterbweise/md2pdf.git
cd md2pdf
npm install
npm run dev
```

Open [http://localhost:3501](http://localhost:3501)

### Docker

```bash
docker-compose up -d
```

See [DOCKER.md](./DOCKER.md) for details.

## Usage

1. Write or paste Markdown/HTML content
2. Preview updates in real-time
3. Click "Options" for formatting (fonts, margins, page size)
4. Click "Export PDF"

**Notion Import**: Click "Import" and upload Notion HTML exports (ZIP files supported with nested archives)

## SEO & Branding

### Regenerate Favicons

If you update the logo (`public/icon.png`), regenerate all favicon variants:

```bash
npm run generate-favicons
```

This creates `favicon.ico`, `icon-192.png`, `icon-512.png`, and `apple-touch-icon.png`. See [FAVICON.md](./FAVICON.md) for details.

### SEO Configuration

MD2PDF is pre-configured with enterprise-grade SEO:

- **Metadata**: 55+ targeted keywords, Open Graph, Twitter Cards
- **Structured Data**: 5 JSON-LD schemas (WebApplication, SoftwareApplication, FAQPage, etc.)
- **Sitemap**: Auto-generated at `/sitemap.xml`
- **Robots.txt**: Auto-generated at `/robots.txt`
- **Semantic HTML**: Proper `<h1>`, `<article>`, `<section>`, ARIA labels
- **Performance Headers**: Security headers, caching, Core Web Vitals optimization
- **PWA Ready**: Web app manifest at `/manifest.json`

**Post-deployment steps:**
1. Register domain with [Google Search Console](https://search.google.com/search-console)
2. Submit sitemap: `https://md2pdf.my/sitemap.xml`
3. Add Google Analytics or [Plausible](https://plausible.io/) for traffic tracking
4. Monitor Core Web Vitals in [PageSpeed Insights](https://pagespeed.web.dev/)

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- ⭐ [Star this repository](https://github.com/sterbweise/md2pdf/stars)
- 💖 [Sponsor on GitHub](https://github.com/sponsors/sterbweise)
- 🐛 [Report issues](https://github.com/sterbweise/md2pdf/issues)

---

**Free to use. Open source. Made with ❤️**
