import { AuthExceptionFilter } from './auth-exception.filter';
import { HttpStatus } from '@nestjs/common';

describe('AuthExceptionFilter', () => {
  let filter: AuthExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;

  beforeEach(() => {
    filter = new AuthExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      path: '/api/auth/profile',
    };
  });

  describe('catch', () => {
    it('debe manejar UnauthorizedException', () => {
      const error = new Error('Unauthorized');
      error.name = 'UnauthorizedException';

      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as any;

      filter.catch(error, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
          path: '/api/auth/profile',
        }),
      );
    });

    it('debe manejar TokenExpiredError', () => {
      const error = new Error('Token expirado');
      error.name = 'TokenExpiredError';

      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as any;

      filter.catch(error, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Token expirado',
        }),
      );
    });

    it('debe manejar JsonWebTokenError', () => {
      const error = new Error('invalid token');
      error.name = 'JsonWebTokenError';

      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as any;

      filter.catch(error, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Token inválido',
        }),
      );
    });

    it('debe manejar "No auth token" message', () => {
      const error = new Error('No auth token found');

      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as any;

      filter.catch(error, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Token de autenticación requerido',
        }),
      );
    });

    it('debe manejar errores genéricos con statusCode', () => {
      const error = new Error('Custom error');
      error['statusCode'] = 400;

      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as any;

      filter.catch(error, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Custom error',
        }),
      );
    });

    it('debe defaultear a 500 si no hay statusCode', () => {
      const error = new Error('Unknown error');

      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as any;

      filter.catch(error, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
  });
});
