const { pathTraversalMiddleware, securityHeaders, rateLimitMiddleware } = require('../../src/middleware/security');
const { errorHandler, PathTraversalError } = require('../../src/middleware/errorHandler');
const correlationMiddleware = require('../../src/middleware/correlation');

describe('Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      path: '/test',
      method: 'GET',
      headers: {},
      correlationId: 'test-correlation-id'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('pathTraversalMiddleware', () => {
    it('blocks ../ attacks', () => {
      mockReq.path = '/static/../../../etc/passwd';
      
      pathTraversalMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Forbidden' }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('allows valid paths', () => {
      mockReq.path = '/static/css/styles.css';
      
      pathTraversalMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('blocks path traversal with encoded characters', () => {
      mockReq.path = '/static/%2e%2e/%2e%2e/etc/passwd';
      
      pathTraversalMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('correlationMiddleware', () => {
    it('generates correlation ID when not provided', () => {
      correlationMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockReq.correlationId).toBeDefined();
      expect(mockReq.correlationId.length).toBeGreaterThan(0);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Correlation-ID', mockReq.correlationId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('uses existing correlation ID from header', () => {
      mockReq.headers['x-correlation-id'] = 'existing-id';
      
      correlationMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockReq.correlationId).toBe('existing-id');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Correlation-ID', 'existing-id');
    });
  });

  describe('errorHandler', () => {
    it('handles errors with correlation ID', () => {
      const error = new Error('Test error');
      
      errorHandler(error, mockReq, mockRes, jest.fn());
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Test error',
        correlationId: 'test-correlation-id'
      }));
    });

    it('uses error status when available', () => {
      const error = new PathTraversalError();
      
      errorHandler(error, mockReq, mockRes, jest.fn());
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });
});
