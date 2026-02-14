# Docker Deployment Guide

This guide explains how to deploy the MD to PDF converter using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, but recommended)

## Quick Start with Docker Compose

The easiest way to run the application:

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The application will be available at `http://localhost:3501`

## Manual Docker Build

If you prefer to use Docker commands directly:

```bash
# Build the image
docker build -t md-to-pdf .

# Run the container
docker run -d \
  --name md-to-pdf \
  -p 3501:3501 \
  --restart unless-stopped \
  md-to-pdf

# View logs
docker logs -f md-to-pdf

# Stop the container
docker stop md-to-pdf
docker rm md-to-pdf
```

## Configuration

### Environment Variables

Create a `.env.production` file if you need to configure environment variables:

```env
# Optional: Notion API configuration
# NOTION_API_KEY=your_api_key_here

# Optional: Customize port (default: 3501)
# PORT=3501
```

Then update `docker-compose.yml` to use it:

```yaml
env_file:
  - .env.production
```

### Port Mapping

To run on a different host port, change the port mapping:

```bash
# Run on port 8080 instead of 3501
docker run -d -p 8080:3501 --name md-to-pdf md-to-pdf
```

Or in `docker-compose.yml`:

```yaml
ports:
  - "8080:3501"
```

## Docker Image Details

### What's Included

- **Node.js 20** (Alpine Linux for minimal size)
- **Chromium** (pre-installed for Puppeteer)
- **Next.js** (standalone build for optimal performance)
- **Health check endpoint** at `/api/health`

### Image Size

- Approximate size: ~500-700 MB (includes Chromium)
- Multi-stage build minimizes final image size

### Security Features

- Runs as non-root user (`nextjs:nodejs`)
- Minimal Alpine Linux base
- Security capabilities restricted
- No unnecessary packages

## Production Deployment

### Using Docker Hub (Recommended)

1. **Build and tag your image:**

```bash
docker build -t yourusername/md-to-pdf:latest .
docker push yourusername/md-to-pdf:latest
```

2. **Deploy on your server:**

```bash
docker pull yourusername/md-to-pdf:latest
docker run -d -p 3501:3501 --name md-to-pdf yourusername/md-to-pdf:latest
```

### Using Docker Compose in Production

```yaml
version: "3.8"

services:
  md-to-pdf:
    image: yourusername/md-to-pdf:latest
    restart: always
    ports:
      - "3501:3501"
    environment:
      - NODE_ENV=production
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 1G
```

### Behind a Reverse Proxy (Nginx/Caddy)

**Nginx example:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3501;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeout for PDF generation
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

**Caddy example:**

```
your-domain.com {
    reverse_proxy localhost:3501 {
        # Increase timeout for PDF generation
        timeout 120s
    }
}
```

## Troubleshooting

### Container won't start

Check logs:

```bash
docker logs md-to-pdf
```

### Chromium issues

If Puppeteer can't find Chromium:

```bash
# Enter the container
docker exec -it md-to-pdf sh

# Check if Chromium is installed
which chromium-browser
chromium-browser --version
```

### Memory issues

Increase memory limits in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 2G
```

### Permission issues

Make sure the container has proper write permissions:

```bash
docker exec -it md-to-pdf sh
ls -la /app
```

## Health Check

The application includes a health check endpoint at `/api/health`:

```bash
# Check if the service is healthy
curl http://localhost:3501/api/health
# Response: {"status":"ok","timestamp":"2026-02-06T..."}
```

## Updating the Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Or with manual Docker
docker stop md-to-pdf
docker rm md-to-pdf
docker build -t md-to-pdf .
docker run -d -p 3501:3501 --name md-to-pdf md-to-pdf
```

## Performance Tips

1. **Increase timeout** for large documents (already set to 60s in the app)
2. **Resource limits**: Allocate at least 512MB RAM, preferably 1GB
3. **Reverse proxy**: Use Nginx/Caddy for SSL and better performance
4. **Caching**: Enable browser caching for static assets

## Security Considerations

- Container runs as non-root user
- Minimal Alpine base reduces attack surface
- No unnecessary capabilities
- Health checks monitor service availability
- Consider using secrets management for sensitive env vars

## Cloud Deployment Platforms

### Vercel (Easiest)

```bash
npm install -g vercel
vercel --prod
```

### Railway

```bash
railway up
```

### DigitalOcean App Platform

- Connect your GitHub repo
- Auto-detects Next.js
- Set environment variables in dashboard

### AWS ECS / Google Cloud Run / Azure Container Instances

Use the Docker image with your cloud provider's container service.

## Support

For issues related to Docker deployment, please open an issue on GitHub.
