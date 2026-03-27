const { pathTraversalGuard, PathTraversalError } = require('../../src/middleware/pathTraversal');
const { correlationIdMiddleware } = require('../../src/middleware/errorHandler');
const path = require('path');

// Mock config
jest.mock('../../src/config', () => ({
  config: {
    port: 3000,
    staticDir: '/app/public',
    logLevel: 'combined',
    correlationIdHeader: 'X-Request-ID'
  },
  validateConfig: jest.fn().mockReturnValue({})
}));

// Mock req/res objects
function createMockReq(params = {}) {
  return {
    get: jest.fn(),
    params: params,
    path: params.staticPath || ''
  };
}

function createMockRes() {
  return {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

function createMockNext() {
  return jest.fn();
}

describe('Path Traversal Guard Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = createMockReq();
    mockRes = createMockRes();
    mockNext = createMockNext();
  });

  test('rejects paths with ../ traversal', () => {
    mockReq.path = '../etc/passwd';
    pathTraversalGuard(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'PATH_TRAVERSAL'
    }));
  });

  test('rejects paths with encoded ../ traversal', () => {
    mockReq.path = '..%2F..%2Fetc%2Fpasswd';
    pathTraversalGuard(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'PATH_TRAVERSAL'
    }));
  });

  test('allows valid file paths', () => {
    mockReq.path = 'css/style.css';
    mockReq.correlationId = 'test-id';
    pathTraversalGuard(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
    expect(mockReq.safePath).toBeDefined();
  });

  test('allows paths with dots in filenames', () => {
    mockReq.path = 'js/app.bundle.js';
    mockReq.correlationId = 'test-id';
    pathTraversalGuard(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  test('sets safePath on request for valid paths', () => {
    mockReq.path = 'images/logo.png';
    mockReq.correlationId = 'test-id';
    pathTraversalGuard(mockReq, mockRes, mockNext);
    expect(mockReq.safePath).toBeDefined();
    expect(mockReq.safePath).toContain('images/logo.png');
  });
});

describe('Correlation ID Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = createMockReq();
    mockRes = createMockRes();
    mockNext = createMockNext();
  });

  test('generates unique correlation ID when none provided', () => {
    mockReq.get.mockReturnValue(undefined);
    correlationIdMiddleware(mockReq, mockRes, mockNext);
    expect(mockReq.correlationId).toBeDefined();
    expect(mockReq.correlationId.length).toBe(36); // UUID v4 format
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', mockReq.correlationId);
  });

  test('uses existing correlation ID from header', () => {
    const existingId = 'existing-correlation-id-123';
    mockReq.get.mockReturnValue(existingId);
    correlationIdMiddleware(mockReq, mockRes, mockNext);
    expect(mockReq.correlationId).toBe(existingId);
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', existingId);
  });
});

describe('PathTraversalError', () => {
  test('has correct status code and name', () => {
    const error = new PathTraversalError('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('PathTraversalError');
    expect(error.code).toBe('PATH_TRAVERSAL');
    expect(error.message).toBe('Test error');
  });
});
