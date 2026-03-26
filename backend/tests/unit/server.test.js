const { pathTraversalMiddleware, PathTraversalError } = require('../../src/middleware/security');
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
    params: params
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

describe('Path Traversal Middleware', () => {
  let mockReq, mockRes, mockNext;
  
  beforeEach(() => {
    mockReq = createMockReq();
    mockRes = createMockRes();
    mockNext = createMockNext();
  });
  
  test('rejects paths with ../ traversal', () => {
    mockReq.params.staticPath = '../etc/passwd';
    pathTraversalMiddleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(PathTraversalError));
  });
  
  test('rejects absolute paths', () => {
    mockReq.params.staticPath = '/etc/passwd';
    pathTraversalMiddleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(PathTraversalError));
  });
  
  test('rejects paths with null bytes', () => {
    mockReq.params.staticPath = 'file\x00.txt';
    pathTraversalMiddleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(PathTraversalError));
  });
  
  test('allows valid file paths', () => {
    mockReq.params.staticPath = 'css/style.css';
    pathTraversalMiddleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });
  
  test('allows paths with encoded traversal', () => {
    mockReq.params.staticPath = '..%2F..%2Fetc%2Fpasswd';
    pathTraversalMiddleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(PathTraversalError));
  });
  
  test('allows paths with dots in filenames', () => {
    mockReq.params.staticPath = 'js/app.bundle.js';
    pathTraversalMiddleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });
  
  test('skips check when staticPath is undefined', () => {
    mockReq.params.staticPath = undefined;
    pathTraversalMiddleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });
  
  test('skips check when staticPath is empty string', () => {
    mockReq.params.staticPath = '';
    pathTraversalMiddleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
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
