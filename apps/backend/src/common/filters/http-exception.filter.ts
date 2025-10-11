import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as dayjs from 'dayjs';
import logger from '../logger';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionRes = exception.getResponse();
    const normalized = this.normalizeExceptionBody(exceptionRes);

    const errorResponse = {
      timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      message: normalized.message,
      path: request?.url,
      code: -1,
      error: normalized.error,
      statusCode: status,
    };
    logger.error(
      `${request?.method} ${request?.url} ${request.user && request.user._id.toString()} ${JSON.stringify(request.query)}  ${JSON.stringify(request.body)} ${JSON.stringify(errorResponse)}`,
    );

    response.status(status).json(errorResponse);
  }

  private normalizeExceptionBody(payload: unknown): {
    error: string;
    message: string | unknown;
  } {
    if (!payload) {
      return {
        error: 'Unknown Error',
        message: '未知错误',
      };
    }

    if (typeof payload === 'string') {
      return {
        error: 'Error',
        message: payload,
      };
    }

    if (typeof payload === 'object') {
      const { error, message } = payload as {
        error?: string;
        message?: string | unknown;
      };
      return {
        error: error ?? 'Error',
        message: message ?? payload,
      };
    }

    return {
      error: 'Error',
      message: payload,
    };
  }
}
