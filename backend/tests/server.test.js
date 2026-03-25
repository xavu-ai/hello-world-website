import request from 'supertest';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a test app instance
const createApp = () => {
  const app = express();
  const publicPath = join(__dirname, '..', '..', 'public');
  
  app.use(express.static(publicPath));
  
  app.get('/', (req, res) => {
    res.sendFile(join(publicPath, 'index.html'));
  });
  
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  app.use((req, res) => {
    res.status(404).send('Not Found');
  });
  
  return app;
};

describe('Hello World Server', () => {
  let server;
  let app;

  beforeAll((done) => {
    app = createApp();
    server = app.listen(0, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('GET /', () => {
    it('should serve index.html at root path', async () => {
      const res = await request(server).get('/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('Hello World');
    });
  });

  describe('GET /styles.css', () => {
    it('should serve CSS file with correct Content-Type', async () => {
      const res = await request(server).get('/styles.css');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/css');
    });
  });

  describe('GET /app.js', () => {
    it('should serve JS file with correct Content-Type', async () => {
      const res = await request(server).get('/app.js');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/javascript');
    });
  });

  describe('GET /health', () => {
    it('should return health check status', async () => {
      const res = await request(server).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for non-existent routes', async () => {
      const res = await request(server).get('/nonexistent');
      expect(res.status).toBe(404);
    });
  });
});
