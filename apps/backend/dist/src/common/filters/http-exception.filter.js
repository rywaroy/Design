"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const dayjs = require("dayjs");
const logger_1 = require("../logger");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
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
        logger_1.default.error(`${request?.method} ${request?.url} ${request.user && request.user._id.toString()} ${JSON.stringify(request.query)}  ${JSON.stringify(request.body)} ${JSON.stringify(errorResponse)}`);
        response.status(status).json(errorResponse);
    }
    normalizeExceptionBody(payload) {
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
            const { error, message } = payload;
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
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)(common_1.HttpException)
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map