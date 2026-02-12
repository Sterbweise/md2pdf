# MD to PDF Converter

✨ Modern Markdown & HTML to PDF converter with smart page breaks, Notion export support, custom formatting options, and a clean minimalist interface. Free and open source.

## Features

### Core Functionality
- 📝 **Dual Mode**: Convert Markdown or HTML to PDF
- 🎨 **Smart Page Breaks**: Intelligent layout to minimize white space
- 📦 **Notion Support**: Direct API import + nested ZIP export handling
- 🖼️ **Image Embedding**: Automatic base64 embedding for images in ZIP files
- 👁️ **Live Preview**: Real-time rendering as you type

### Advanced Customization
- 🎯 **11+ Font Families**: Inter, Georgia, Times, Garamond, Palatino, Helvetica, Arial, Roboto, and more
- 💻 **Code Fonts**: JetBrains Mono (default), Fira Code, Source Code Pro, Consolas, Monaco, Menlo
- 📏 **Custom Options**: Font size, margins (4 sides), line height, footer text
- 📄 **Page Options**: A4/Letter/Legal, page numbers, custom footers
- 🌓 **Dark Mode**: Full dark mode support

### Document Features
- ✅ **GitHub Flavored Markdown**: Tables, task lists, code blocks, and more
- 🎨 **Syntax Highlighting**: Beautiful code highlighting
- 📊 **Smart Tables**: Tables can break across pages while repeating headers
- 📝 **Editable Filename**: Click to rename your document
- 💾 **File Import Modal**: Drag & drop for .md, .html, .txt, .zip files

## Tech Stack

- **Next.js 15** with TypeScript
- **Tailwind CSS** with Notion-inspired design
- **Puppeteer** for PDF generation with Chromium
- **JSZip** for nested ZIP extraction
- **react-markdown** + **remark-gfm** for markdown parsing
- **@notionhq/client** for Notion API integration

## Getting Started

### Local Development

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/md-to-pdf.git
   cd md-to-pdf
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run the development server:**

   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

### Docker Deployment

See [DOCKER.md](./DOCKER.md) for complete Docker deployment guide.

**Quick start:**

```bash
# Using Docker Compose
docker-compose up -d

# Or manual Docker
docker build -t md-to-pdf .
docker run -d -p 3000:3000 --name md-to-pdf md-to-pdf
```

The app will be available at `http://localhost:3000`

## Usage

### Markdown to PDF

1. Write or paste your Markdown content
2. See live preview on the right
3. Click "Options" to customize formatting
4. Click "Export PDF" to download

### HTML to PDF

1. Switch to "HTML" mode
2. Paste HTML or upload `.html` file
3. Preview renders your HTML
4. Export to PDF with custom options

### Notion Exports

**Option 1: Direct Import (API)**
1. Click "Notion" button
2. Enter page URL and API key
3. Import converts to Markdown automatically

**Option 2: ZIP Upload**
1. Export from Notion as HTML (includes ZIP)
2. Click "Import" button
3. Upload the ZIP file
4. Handles nested `ExportBlock*.zip` files automatically
5. All images are embedded for PDF export

## Export Options

Access via the "Options" button:

### Standard Options
- **Page Size**: A4, Letter, Legal
- **Margins**: Narrow (0.5"), Normal (0.75"), Wide (1")
- **Font Size**: Small (10pt), Medium (12pt), Large (14pt)
- **Body Font**: 11 choices (Inter default)
- **Code Font**: 6 monospace fonts (JetBrains Mono default)
- **Line Height**: Compact (1.4), Normal (1.6), Relaxed (1.8)
- **Page Numbers**: Toggle on/off

### Custom Options
- **Custom Font Size**: 6-24pt (any value)
- **Custom Margins**: Set each side independently (0-3 inches)
- **Custom Line Height**: 1.0-3.0 multiplier
- **Custom Footer**: Add text to bottom of each page

## Project Structure

```
md-to-pdf/
├── app/
│   ├── api/
│   │   ├── convert-pdf/route.ts       # PDF generation endpoint
│   │   ├── notion-import/route.ts     # Notion API integration
│   │   └── health/route.ts            # Health check for Docker
│   ├── components/
│   │   ├── MarkdownEditor.tsx         # Code editor
│   │   ├── PreviewPane.tsx            # Live preview
│   │   ├── FileImportModal.tsx        # File upload modal
│   │   ├── ExportOptions.tsx          # PDF customization
│   │   ├── NotionImporter.tsx         # Notion import modal
│   │   └── ThankYouModal.tsx          # Post-download modal
│   ├── lib/
│   │   ├── pdfGenerator.ts            # Puppeteer PDF logic
│   │   ├── pdfStyles.ts               # Smart page break CSS
│   │   ├── markdownParser.ts          # MD to HTML conversion
│   │   ├── htmlImageEmbedder.ts       # Image embedding
│   │   └── notionConverter.ts         # Notion to MD
│   ├── page.tsx                       # Main app page
│   └── globals.css                    # Global styles
├── Dockerfile                         # Production Docker build
├── docker-compose.yml                 # Docker Compose config
├── .dockerignore                      # Docker ignore rules
├── .gitignore                         # Git ignore rules
├── next.config.ts                     # Next.js config
├── tailwind.config.ts                 # Tailwind config
└── package.json
```

## Configuration

Update these values in `app/page.tsx`:

```typescript
const CONFIG = {
  githubRepo: "https://github.com/yourusername/md-to-pdf",
  donationUrl: "https://github.com/sponsors/yourusername",
  linkedIn: "https://www.linkedin.com/in/yourprofile/",
  website: "https://yourwebsite.com/",
};
```

## Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint

# Docker
docker-compose up -d # Start with Docker
```

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with JavaScript enabled

## Known Limitations

- PDF generation requires Chromium/Chrome (included in Docker)
- Maximum file size: 1MB (configurable)
- PDF generation timeout: 60 seconds (configurable)
- Notion API requires integration token

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Deployment

### Vercel (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Docker
See [DOCKER.md](./DOCKER.md) for complete guide.

### Other Platforms
- **Railway**: `railway up`
- **DigitalOcean**: App Platform auto-detects Next.js
- **AWS/GCP/Azure**: Use Docker image or deploy as Node.js app

## License

MIT License - see [LICENSE](LICENSE) file for details

## Author

Made by [kchndz.dev](https://kchndz.dev/)

## Support

- ⭐ Star this repository
- 💖 [Sponsor on GitHub](https://github.com/sponsors/yourusername)
- 🐛 [Report issues](https://github.com/yourusername/md-to-pdf/issues)
- 💼 [Connect on LinkedIn](https://www.linkedin.com/in/kchndz/)

---

**Free to use. Open source. Made with ❤️**
