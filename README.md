# Hello World Website

A simple "Hello World" website with a static file server backend.

## Project Structure

```
hello-world-website/
├── backend/
│   ├── server.js         # Static file server
│   ├── package.json
│   ├── playwright.config.js
│   └── tests/
│       ├── server.test.js
│       └── e2e.test.js
├── public/               # Static files served by backend
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js
├── Dockerfile           # Multi-stage build for production
├── docker-compose.yml   # Local development
└── README.md
```

## Quick Start

### Option 1: Run with Node.js

```bash
cd backend
npm install
npm start
```

Server will be available at http://localhost:3000

### Option 2: Run with Docker

```bash
docker compose up
```

Or for production build:

```bash
docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml up -d
```

## Development

### Running Tests

```bash
cd backend
npm install
npm test
```

### E2E Smoke Tests

E2E tests use Playwright to verify the full application stack in a browser.

**Prerequisites:**
```bash
cd backend
npm install
npx playwright install chromium
```

**Run E2E tests:**
```bash
# Start the application (Docker)
docker compose up -d

# Run Playwright E2E tests from host
npx playwright test
```

**Or run inside Docker:**
```bash
docker compose up -d
docker compose run --rm backend npx playwright test
```

**Test coverage:**
- Page loads without JavaScript errors
- Page title is "Hello World"
- Heading "#greeting" is visible and centered
- Date/time display "#timestamp" is populated on load
- No 404 errors for CSS or JS resources
- Layout renders correctly at 375px viewport width (mobile)
- Static CSS and JS files return HTTP 200

### Environment Variables

| Variable   | Default | Description              |
|------------|---------|--------------------------|
| `PORT`     | 3000    | Server port              |
| `NODE_ENV` | production | Environment mode      |

## Endpoints

| Endpoint   | Method | Description                    |
|------------|--------|--------------------------------|
| `/`        | GET    | Serves index.html              |
| `/health`  | GET    | Health check endpoint          |
| `/css/styles.css` | GET | Serves CSS stylesheet         |
| `/js/app.js`  | GET  | Serves JavaScript file         |

## Production Deployment

The Dockerfile uses a multi-stage build:

1. **Stage 1 (builder)**: Installs dependencies
2. **Stage 2 (production)**: Runs as non-root user with minimal image

Build and run:

```bash
docker build -t hello-world-website .
docker run -p 3000:3000 hello-world-website
```
