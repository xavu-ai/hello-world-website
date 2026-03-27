# Hello World Website

A simple "Hello World" website with a static file server backend.

## Project Structure

```
hello-world-website/
├── backend/
│   ├── index.js          # Express static file server
│   ├── package.json
│   └── tests/
│       └── server.test.js
├── public/               # Static files served by backend
│   ├── index.html
│   ├── styles.css
│   └── app.js
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
| `/styles.css` | GET | Serves CSS stylesheet         |
| `/app.js`  | GET    | Serves JavaScript file         |

## Production Deployment

The Dockerfile uses a multi-stage build:

1. **Stage 1 (builder)**: Installs dependencies
2. **Stage 2 (production)**: Runs as non-root user with minimal image

Build and run:

```bash
docker build -t hello-world-website .
docker run -p 3000:3000 hello-world-website
```
