# Hello World Website

A simple "Hello World" website with a static file server backend.

## Project Structure

```
hello-world-website/
├── backend/
│   ├── src/                 # Express server source
│   │   ├── app.js          # Express app factory
│   │   ├── server.js       # Server entry point
│   │   ├── config/         # Configuration
│   │   ├── middleware/     # Express middleware
│   │   └── routes/         # API routes
│   ├── public/             # Static files served by backend
│   │   ├── index.html
│   │   ├── css/styles.css
│   │   └── js/app.js
│   ├── tests/              # Jest tests
│   │   ├── unit/
│   │   └── integration/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## How to Run

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)

### Quick Start (Docker)

```bash
git clone https://github.com/xavu-ai/hello-world-website.git
cd hello-world-website
git checkout feature/TEST-001-hello-world-site
docker compose up --build
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3000/health

### Verify Installation

```bash
# Run smoke tests
curl http://localhost:3000 | grep "Hello World"
curl http://localhost:3000/health
```

### Common Issues

**CORS errors in browser console?**
Ensure `CORS_ORIGINS` env var is set correctly in backend.

**Port already in use?**
Change ports in `docker-compose.yml` or stop existing services:
```bash
docker compose down
lsof -ti:3000 | xargs kill -9
```

**Container not starting?**
Check container logs: `docker compose logs backend`

### Development (without Docker)

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Open browser to http://localhost:3000
```

### Running Tests

```bash
cd backend
npm install
npm test
```

## Endpoints

| Endpoint   | Method | Description                    |
|------------|--------|--------------------------------|
| `/`        | GET    | Serves index.html              |
| `/health`  | GET    | Health check endpoint          |
| `/css/*`   | GET    | Serves CSS stylesheets        |
| `/js/*`    | GET    | Serves JavaScript files       |

## Environment Variables

| Variable              | Default | Description                     |
|-----------------------|---------|---------------------------------|
| `PORT`                | 3000    | Server port                    |
| `NODE_ENV`            | production | Environment mode          |
| `CORS_ORIGINS`        | *       | Comma-separated CORS origins   |
| `RATE_LIMIT_WINDOW_MS`| 900000  | Rate limit window (15 min)      |
| `RATE_LIMIT_MAX`      | 100     | Max requests per window         |

## Production Deployment

The Dockerfile uses a multi-stage build:

1. **Stage 1 (builder)**: Installs dependencies
2. **Stage 2 (production)**: Runs as non-root user with minimal image

Build and run:

```bash
docker build -t hello-world-website ./backend
docker run -p 3000:3000 hello-world-website
```
