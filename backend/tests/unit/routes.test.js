const healthRouter = require('../../src/routes/health');

// Mock config
jest.mock('../../src/config', () => ({
  config: {
    port: 3000,
    staticDir: '/app/public',
    logLevel: 'combined',
    correlationIdHeader: 'X-Request-ID',
    rateLimitWindowMs: 900000,
    rateLimitMax: 100,
    corsOrigins: '*'
  },
  validateConfig: jest.fn().mockReturnValue({})
}));

// Mock req/res objects
function createMockReq() {
  return {
    get: jest.fn(),
    path: '/health',
    correlationId: 'test-correlation-id'
  };
}

function createMockRes() {
  return {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

describe('Health Routes', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = createMockReq();
    mockRes = createMockRes();
  });

  describe('GET /health', () => {
    test('returns health status with timestamp', () => {
      const router = healthRouter;
      const handler = router.stack.find(layer => layer.route && layer.route.path === '/health');
      
      // Call the route handler directly
      handler.route.stack[0].handle(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalled();
      const responseBody = mockRes.json.mock.calls[0][0];
      expect(responseBody.status).toBe('healthy');
      expect(responseBody.timestamp).toBeDefined();
      expect(responseBody.version).toBe('1.0.0');
      expect(() => new Date(responseBody.timestamp)).not.toThrow();
    });
  });
});

describe('Error Handler', () => {
  const { errorHandler, NotFoundError, ValidationError, InternalError } = require('../../src/middleware/errorHandler');
  
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      correlationId: 'test-correlation-id',
      path: '/test',
      method: 'GET'
    };
    mockRes = createMockRes();
    mockNext = jest.fn();
  });

  test('handles NotFoundError with 404 status', () => {
    const error = new NotFoundError('File not found');
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(404);
    const responseBody = mockRes.json.mock.calls[0][0];
    expect(responseBody.error.code).toBe('NOT_FOUND');
    expect(responseBody.error.correlationId).toBe('test-correlation-id');
  });

  test('handles ValidationError with 400 status', () => {
    const error = new ValidationError('Invalid input');
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(400);
    const responseBody = mockRes.json.mock.calls[0][0];
    expect(responseBody.error.code).toBe('VALIDATION_ERROR');
  });

  test('handles InternalError with 500 status', () => {
    const error = new InternalError('Something went wrong');
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(500);
    const responseBody = mockRes.json.mock.calls[0][0];
    expect(responseBody.error.code).toBe('INTERNAL_ERROR');
  });

  test('returns error object with correct format', () => {
    const error = new NotFoundError('Not found');
    errorHandler(error, mockReq, mockRes, mockNext);
    
    const responseBody = mockRes.json.mock.calls[0][0];
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe('NOT_FOUND');
    expect(responseBody.error.message).toBe('Not found');
    expect(responseBody.error.correlationId).toBe('test-correlation-id');
  });
});
