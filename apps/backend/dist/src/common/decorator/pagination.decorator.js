"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiPaginatedResponse = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pagination_dto_1 = require("../dto/pagination.dto");
const api_response_dto_1 = require("../dto/api-response.dto");
const ApiPaginatedResponse = (model, message = '操作成功', code = 200) => {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiExtraModels)(model, pagination_dto_1.PaginationDto), (0, swagger_1.ApiOkResponse)({
        schema: {
            allOf: [
                { $ref: (0, swagger_1.getSchemaPath)(api_response_dto_1.ApiResponseDto) },
                {
                    properties: {
                        data: {
                            allOf: [
                                { $ref: (0, swagger_1.getSchemaPath)(pagination_dto_1.PaginationDto) },
                                {
                                    properties: {
                                        list: {
                                            type: 'array',
                                            items: {
                                                $ref: (0, swagger_1.getSchemaPath)(model),
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                        message: {
                            type: 'string',
                            default: message,
                        },
                        code: {
                            type: 'number',
                            default: code,
                        },
                    },
                },
            ],
        },
    }));
};
exports.ApiPaginatedResponse = ApiPaginatedResponse;
//# sourceMappingURL=pagination.decorator.js.map