const request = require('supertest');
const { app } = require('../../src/server');
const { promises: fs } = require('fs');
const { join } = require('path');
const config = require('../../src/config');

describe('Server Integration Tests', () => {
  const staticPath = config.staticPath;

  beforeAll(async () => {
    const cssDir = join(staticPath, 'css');
    await fs.mkdir(cssDir, { recursive: true });
    await fs.writeFile(join(staticPath, 'index.html'), '<html><body>Hello World</body></html>');
    await fs.writeFile(join(staticPath, 'css', 'styles.css'), 'body { color: red; }');
  });

  afterAll(async () => {
    try {
      await fs.rm(join(staticPath, 'css'), { recursive: true });
      await fs.rm(join(staticPath, 'index.html'));
    } catch (e) {}
  });

  describe('GET /health', () => {
    it('returns healthy status', async () => {
      const res = await request(app).get('/health');
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /', () => {
    it('returns index.html', async () => {
      const res = await request(app).get('/');
      
      expect(res.status).toBe(200);
      expect(res.text).toContain('Hello World');
    });
  });

  describe('GET /static/*', () => {
    it('returns CSS with correct content-type', async () => {
      const res = await request(app).get('/static/css/styles.css');
      
      expect(res.status).toBe(200);
      expect(res.text).toBe('body { color: red; }');
    });

    it('returns 404 for nonexistent static files', async () => {
      const res = await request(app).get('/static/nonexistent.txt');
      
      expect(res.status).toBe(404);
    });

    it('returns ETag header', async () => {
      const res = await request(app).get('/static/css/styles.css');
      
      expect(res.headers.etag).toBeDefined();
    });

    it('returns 304 when ETag matches', async () => {
      const firstRes = await request(app).get('/static/css/styles.css');
      const etag = firstRes.headers.etag;
      
      const secondRes = await request(app)
        .get('/static/css/styles.css')
        .set('If-None-Match', etag);
      
      expect(secondRes.status).toBe(304);
    });
  });

  describe('SPA fallback', () => {
    it('serves index.html for unknown routes', async () => {
      const res = await request(app).get('/unknown/route');
      
      expect(res.status).toBe(200);
      expect(res.text).toContain('Hello World');
    });
  });

  describe('Path traversal protection', () => {
    it('returns 403 for path traversal attempt', async () => {
      const res = await request(app).get('/static/../../../etc/passwd');
      
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });
  });

  describe('Compression', () => {
    it('reduces response size with compression', async () => {
      const res = await request(app)
        .get('/static/css/styles.css')
        .set('Accept-Encoding', 'gzip');
      
      expect(res.status).toBe(200);
    });
  });
});
