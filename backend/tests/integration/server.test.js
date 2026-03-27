const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { once } = require('events');

// Set test environment before requiring app
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random available port
process.env.STATIC_DIR = path.join(__dirname, 'fixtures/public');

// Create test fixtures directory and files
const fixturesDir = process.env.STATIC_DIR;
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

const indexContent = '<!DOCTYPE html><html><head><title>Test</title></head><body>Hello World</body></html>';
const cssContent = 'body { color: red; }';

fs.writeFileSync(path.join(fixturesDir, 'index.html'), indexContent);
fs.writeFileSync(path.join(fixturesDir, 'style.css'), cssContent);

// Import createApp from app.js
const { createApp } = require('../../src/app');

let server;
let baseUrl;

beforeAll(async () => {
  const app = createApp();
  server = app.listen(0);
  const addr = server.address();
  baseUrl = `http://localhost:${addr.port}`;
  await once(server, 'listening');
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  // Clean up test fixtures
  try {
    fs.unlinkSync(path.join(fixturesDir, 'index.html'));
    fs.unlinkSync(path.join(fixturesDir, 'style.css'));
    fs.rmdirSync(fixturesDir);
  } catch (err) {
    // Ignore cleanup errors
  }
});

describe('Static File Server Integration Tests', () => {
  describe('GET /', () => {
    test('returns index.html', async () => {
      const response = await request(server).get('/');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.text).toContain('Hello World');
    });
  });

  describe('GET /style.css', () => {
    test('returns CSS with correct Content-Type', async () => {
      const response = await request(server).get('/style.css');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/css/);
      expect(response.text).toBe('body { color: red; }');
    });
  });

  describe('GET /nonexistent', () => {
    test('returns 404', async () => {
      const response = await request(server).get('/nonexistent');
      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
      expect(response.body.correlationId).toBeDefined();
    });
  });

  describe('GET /../package.json', () => {
    test('returns 403 for path traversal attempt', async () => {
      const response = await request(server).get('/../package.json');
      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
      expect(response.body.correlationId).toBeDefined();
    });
  });

  describe('GET /health', () => {
    test('returns valid JSON with ok status', async () => {
      const response = await request(server).get('/health');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body.status).toBe('ok');
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.correlationId).toBeDefined();
      expect(() => new Date(response.body.timestamp)).not.toThrow();
    });
  });

  describe('Correlation ID', () => {
    test('returns X-Request-ID header in response', async () => {
      const response = await request(server).get('/health');
      expect(response.headers['x-request-id']).toBeDefined();
    });

    test('uses provided correlation ID', async () => {
      const customId = 'my-custom-correlation-id';
      const response = await request(server)
        .get('/health')
        .set('X-Request-ID', customId);
      expect(response.headers['x-request-id']).toBe(customId);
      expect(response.body.correlationId).toBe(customId);
    });
  });
});
