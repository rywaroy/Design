"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_response_dto_1 = require("../dto/api-response.dto");
const ApiResponse = (model, message = '操作成功', code = 200) => {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiExtraModels)(model), (0, swagger_1.ApiOkResponse)({
        schema: {
            allOf: [
                { $ref: (0, swagger_1.getSchemaPath)(api_response_dto_1.ApiResponseDto) },
                {
                    properties: {
                        data: {
                            $ref: (0, swagger_1.getSchemaPath)(model),
                        },
                        code: {
                            type: 'number',
                            default: code,
                        },
                        message: {
                            type: 'string',
                            default: message,
                        },
                    },
                },
            ],
        },
    }));
};
exports.ApiResponse = ApiResponse;
//# sourceMappingURL=api-response.decorator.js.map