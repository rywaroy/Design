import { BadGatewayException, BadRequestException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

jest.mock('../logger', () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

const createHost = (responseMock: any, requestMock: any): ArgumentsHost =>
  ({
    switchToHttp: () => ({
      getResponse: () => responseMock,
      getRequest: () => requestMock,
    }),
  }) as unknown as ArgumentsHost;

describe('HttpExceptionFilter', () => {
  const response = () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    return { status, json };
  };

  const request = {
    method: 'POST',
    url: '/api/search',
    user: { _id: { toString: () => 'user-1' } },
    query: {},
    body: {},
  };

  it('preserves original 400 status code', () => {
    const responseMock = response();
    const host = createHost(responseMock, request);
    const filter = new HttpExceptionFilter();

    filter.catch(
      new BadRequestException({
        error: 'Bad Request',
        message: '验证失败',
      }),
      host,
    );

    expect(responseMock.status).toHaveBeenCalledWith(400);
    expect(responseMock.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        error: 'Bad Request',
        message: '验证失败',
      }),
    );
  });

  it('preserves 502 status for upstream failures', () => {
    const responseMock = response();
    const host = createHost(responseMock, request);
    const filter = new HttpExceptionFilter();

    filter.catch(new BadGatewayException('服务暂时不可用'), host);

    expect(responseMock.status).toHaveBeenCalledWith(502);
    expect(responseMock.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 502,
        message: '服务暂时不可用',
      }),
    );
  });
});
