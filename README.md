# MD2PDF

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![GitHub Repo Size](https://img.shields.io/github/repo-size/Sterbweise/md2pdf)](https://github.com/Sterbweise/md2pdf)
[![Status](https://status.sterbweise.dev/api/badge/2/status)](https://status.sterbweise.dev/status/apps)
[![Uptime](https://status.sterbweise.dev/api/badge/2/uptime)](https://status.sterbweise.dev/status/apps)
[![Response](https://status.sterbweise.dev/api/badge/2/response)](https://status.sterbweise.dev/status/apps)


Modern Markdown and HTML to PDF converter with smart formatting and Notion export support. **100% free, open source, unlimited conversions.**

## Features

- **Dual Mode** – Convert Markdown or HTML to PDF
- **Smart Page Breaks** – Intelligent layout to minimize white space
- **Notion Support** – Direct API import and nested ZIP export handling
- **Live Preview** – Real-time rendering as you type
- **Custom Formatting** – 11+ fonts, custom margins, line height, and footer text
- **File Import** – Drag & drop support for .md, .html, .txt, and .zip files
- **Dark Mode** – Full dark/light theme support
- **GitHub Flavored Markdown** – Tables, task lists, syntax highlighting

## Tech Stack

- Next.js 16 + TypeScript
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

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- ⭐ [Star this repository](https://github.com/sterbweise/md2pdf/stars)
- 💖 [Sponsor on GitHub](https://github.com/sponsors/sterbweise)
- 🐛 [Report issues](https://github.com/sterbweise/md2pdf/issues)

---

**Free to use. Open source. Made with ❤️**

