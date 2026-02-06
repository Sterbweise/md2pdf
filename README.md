# MD to PDF Converter

A web application that converts Markdown files and Notion pages to beautifully formatted, print-ready PDFs with zero information loss.

## Features

- **Dual Mode**: Choose between Markdown to PDF or HTML to PDF conversion
- **Markdown Support**: Full GitHub Flavored Markdown (GFM) support including tables, code blocks, task lists, and more
- **HTML Support**: Direct HTML to PDF conversion (perfect for Notion HTML exports)
- **ZIP Support**: Upload ZIP files containing HTML + images (automatic image embedding as base64)
- **Isolated Preview**: HTML styles are stripped in preview to prevent layout issues, but kept in PDF
- **Notion Integration**: Import pages directly from Notion using the Notion API
- **Table Rendering**: Tables dynamically adjust column widths and wrap text properly (never crop content)
- **Syntax Highlighting**: Code blocks are beautifully highlighted
- **Export Options**: Customize page size, margins, font size, and page numbers
- **Live Preview**: See your formatted document in real-time as you type

## Tech Stack

- **Next.js 15** with TypeScript
- **Tailwind CSS** for styling
- **react-markdown** + **remark-gfm** for markdown parsing
- **Puppeteer** for PDF generation
- **JSZip** for handling ZIP archives with images
- **@notionhq/client** + **notion-to-md** for Notion integration

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone <your-repo-url>
   cd md-to-pdf
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Mode 1: Markdown to PDF

1. Click the **"Markdown to PDF"** tab
2. Paste or type your markdown content in the editor
3. Or upload a `.md` file using the drag-and-drop uploader
4. Preview your formatted document on the right
5. Click "Export PDF" to download

### Mode 2: HTML to PDF

1. Click the **"HTML to PDF"** tab
2. Paste your HTML content in the editor
3. Or upload a `.html` file (great for Notion HTML exports!)
4. Or upload a `.zip` file containing HTML + images
5. Preview your rendered HTML on the right
6. Click "Export PDF" to download

**Notion Users**:

- Export your page as HTML (File > Export > HTML)
- If your page contains images, Notion will create a ZIP file with the HTML and image folder
- Simply upload the ZIP file - images will be automatically embedded!
- The preview isolates styles to prevent layout issues

### Importing from Notion

1. Click "Import Notion" in the header
2. Enter your Notion page URL
3. Enter your Notion API key (create one at [notion.so/my-integrations](https://www.notion.so/my-integrations))
4. Make sure you've shared the page with your integration
5. Click "Import Page"

### Export Options

Click "Options" to customize:

- **Page Size**: A4, Letter, or Legal
- **Margins**: Narrow, Normal, or Wide
- **Font Size**: Small, Medium, or Large
- **Page Numbers**: Show or hide

## Project Structure

```
md-to-pdf/
├── app/
│   ├── api/
│   │   ├── convert-pdf/route.ts    # PDF generation endpoint
│   │   └── notion-import/route.ts  # Notion page fetching
│   ├── components/
│   │   ├── MarkdownEditor.tsx      # Markdown editor
│   │   ├── PreviewPane.tsx         # Live preview
│   │   ├── FileUploader.tsx        # Drag & drop upload
│   │   ├── NotionImporter.tsx      # Notion import modal
│   │   └── ExportOptions.tsx       # PDF options modal
│   ├── lib/
│   │   ├── markdownParser.ts       # Markdown to HTML
│   │   ├── pdfGenerator.ts         # Puppeteer PDF logic
│   │   ├── pdfStyles.ts            # Print-optimized CSS
│   │   └── notionConverter.ts      # Notion to markdown
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── package.json
└── README.md
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## License

MIT
# md2pdf
