const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.STATIC_DIR = path.join(__dirname, 'fixtures/public');
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_MAX = '1000';

const fixturesDir = process.env.STATIC_DIR;

beforeAll(() => {
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }
  fs.writeFileSync(path.join(fixturesDir, 'index.html'), '<html><body>Test</body></html>');
  fs.writeFileSync(path.join(fixturesDir, 'test.css'), 'body { color: red; }');
  fs.writeFileSync(path.join(fixturesDir, 'test.js'), 'console.log("test");');
});

afterAll(() => {
  try {
    fs.unlinkSync(path.join(fixturesDir, 'index.html'));
    fs.unlinkSync(path.join(fixturesDir, 'test.css'));
    fs.unlinkSync(path.join(fixturesDir, 'test.js'));
    fs.rmdirSync(fixturesDir);
  } catch (e) {
    // Ignore
  }
});

const { createApp } = require('../../src/app');

describe('Static File Serving', () => {
  let server;

  beforeAll(async () => {
    const app = createApp();
    server = app.listen(0);
    const addr = server.address();
    process.env.BASE_URL = `http://localhost:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
  });

  describe('GET /', () => {
    test('serves index.html', async () => {
      const res = await request(server).get('/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });
  });

  describe('GET /test.css', () => {
    test('serves CSS file with correct Content-Type', async () => {
      const res = await request(server).get('/test.css');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/css/);
      expect(res.text).toBe('body { color: red; }');
    });
  });

  describe('GET /test.js', () => {
    test('serves JS file with correct Content-Type', async () => {
      const res = await request(server).get('/test.js');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/javascript|text\/plain/);
    });
  });

  describe('ETag and 304', () => {
    test('returns ETag header', async () => {
      const res = await request(server).get('/test.css');
      expect(res.status).toBe(200);
      expect(res.headers.etag).toBeDefined();
    });

    test('returns 304 when ETag matches', async () => {
      const firstRes = await request(server).get('/test.css');
      const etag = firstRes.headers.etag;
      
      const secondRes = await request(server)
        .get('/test.css')
        .set('If-None-Match', etag);
      expect(secondRes.status).toBe(304);
    });

    test('returns 200 when ETag does not match', async () => {
      const res = await request(server)
        .get('/test.css')
        .set('If-None-Match', 'W/"nonexistent"');
      expect(res.status).toBe(200);
    });
  });

  describe('SPA Fallback', () => {
    test('returns index.html for unknown routes (non-API)', async () => {
      const res = await request(server).get('/unknown/route');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });

    test('returns 404 for unknown /api/* routes', async () => {
      const res = await request(server).get('/api/unknown');
      expect(res.status).toBe(404);
    });
  });

  describe('Path Traversal Protection', () => {
    test('blocks path traversal with ../', async () => {
      const res = await request(server).get('/../package.json');
      expect(res.status).toBe(403);
    });

    test('blocks encoded path traversal', async () => {
      const res = await request(server).get('/..%2F..%2Fetc%2Fpasswd');
      expect(res.status).toBe(403);
    });

    test('blocks null byte injection', async () => {
      const res = await request(server).get('/test.css%00.txt');
      expect(res.status).toBe(403);
    });
  });
});
