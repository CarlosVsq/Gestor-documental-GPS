import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { TimeoutError } from 'rxjs';
import { RpcExceptionFilter } from './rpc-exception.filter';

const mockJson = jest.fn();
const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
const mockResponse = { status: mockStatus };
const mockSwitchToHttp = jest.fn().mockReturnValue({ getResponse: () => mockResponse });
const mockHost = { switchToHttp: mockSwitchToHttp } as unknown as ArgumentsHost;

describe('RpcExceptionFilter', () => {
  let filter: RpcExceptionFilter;

  beforeEach(() => {
    filter = new RpcExceptionFilter();
    jest.clearAllMocks();
  });

  it('re-emite HttpExceptions sin alterar su statusCode ni body', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockJson).toHaveBeenCalledWith(exception.getResponse());
  });

  it('devuelve 503 para TimeoutError (instancia)', () => {
    filter.catch(new TimeoutError(), mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.SERVICE_UNAVAILABLE }),
    );
  });

  it('devuelve 503 para objetos con name === TimeoutError', () => {
    filter.catch({ name: 'TimeoutError' }, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it('mapea el statusCode de un RpcException (ej. 404 de ms-mantenedores)', () => {
    const rpcError = { statusCode: 404, message: 'Contratista no encontrado' };

    filter.catch(rpcError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({ statusCode: 404, message: 'Contratista no encontrado' });
  });

  it('mapea el statusCode 409 de un conflicto RPC', () => {
    const rpcError = { statusCode: 409, message: 'RUT ya registrado' };

    filter.catch(rpcError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(409);
  });

  it('devuelve 500 cuando el error no tiene statusCode', () => {
    filter.catch(new Error('Unexpected'), mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR }),
    );
  });

  it('devuelve 500 para excepciones nulas o sin forma', () => {
    filter.catch(null, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
