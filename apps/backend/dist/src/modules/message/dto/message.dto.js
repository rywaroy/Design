"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListMessageQueryDto = exports.CreateMessageDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const message_entity_1 = require("../entities/message.entity");
const trimValue = ({ value }) => typeof value === 'string' ? value.trim() : value;
class CreateMessageDto {
}
exports.CreateMessageDto = CreateMessageDto;
__decorate([
    (0, class_validator_1.IsMongoId)(),
    (0, swagger_1.ApiProperty)({ description: '所属会话 ID' }),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "sessionId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(message_entity_1.MessageRole),
    (0, swagger_1.ApiProperty)({
        description: '消息角色',
        enum: message_entity_1.MessageRole,
        default: message_entity_1.MessageRole.USER,
    }),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(trimValue),
    (0, swagger_1.ApiPropertyOptional)({ description: '消息文本内容' }),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(50),
    (0, swagger_1.ApiPropertyOptional)({
        description: '图片 URL 列表',
        type: String,
        isArray: true,
    }),
    (0, class_validator_1.IsUrl)({ require_protocol: true }, { each: true, message: 'images 每项必须为合法 URL' }),
    (0, class_transformer_1.Type)(() => String),
    __metadata("design:type", Array)
], CreateMessageDto.prototype, "images", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, swagger_1.ApiPropertyOptional)({ description: '额外的模型响应元数据' }),
    __metadata("design:type", Object)
], CreateMessageDto.prototype, "metadata", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    (0, swagger_1.ApiPropertyOptional)({ description: '自定义消息时间，缺省使用当前时间' }),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "createdAt", void 0);
class ListMessageQueryDto {
}
exports.ListMessageQueryDto = ListMessageQueryDto;
__decorate([
    (0, class_validator_1.IsMongoId)(),
    (0, swagger_1.ApiProperty)({ description: '会话 ID' }),
    __metadata("design:type", String)
], ListMessageQueryDto.prototype, "sessionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(200),
    (0, swagger_1.ApiPropertyOptional)({ description: '返回条数，默认 50，最大 200' }),
    __metadata("design:type", Number)
], ListMessageQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    (0, swagger_1.ApiPropertyOptional)({ description: '仅返回该时间之前的消息，用于分页' }),
    __metadata("design:type", String)
], ListMessageQueryDto.prototype, "before", void 0);
//# sourceMappingURL=message.dto.js.map