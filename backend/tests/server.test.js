import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

process.chdir(join(__dirname, '..'));

// Import the server module - it starts listening when loaded
const { default: server } = await import('../server.js');

// Wait for server to be ready before running tests
const waitForServer = () => new Promise((resolve) => {
  if (server.address() !== null) {
    resolve();
  } else {
    server.once('listening', resolve);
  }
});

const makeRequest = (path) => {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    if (!addr) {
      reject(new Error('Server not ready'));
      return;
    }
    const options = {
      hostname: 'localhost',
      port: addr.port,
      path: path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
};

describe('Static File Server', () => {
  before(async () => {
    // Ensure server is ready before any test runs
    await waitForServer();
  });

  after(() => {
    server.close();
  });

  it('should serve index.html at root path', async () => {
    const res = await makeRequest('/');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.headers['content-type'].includes('text/html'));
    assert.ok(res.body.includes('Hello World'));
  });

  it('should serve CSS file with correct MIME type', async () => {
    const res = await makeRequest('/css/styles.css');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.headers['content-type'].includes('text/css'));
  });

  it('should serve JS file with correct MIME type', async () => {
    const res = await makeRequest('/js/app.js');
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.headers['content-type'].includes('application/javascript'));
  });

  it('should return 404 for missing files', async () => {
    const res = await makeRequest('/nonexistent.html');
    assert.strictEqual(res.statusCode, 404);
  });

  it('should return 403 for directory access attempts', async () => {
    const res = await makeRequest('/css/');
    assert.strictEqual(res.statusCode, 403);
  });
});
