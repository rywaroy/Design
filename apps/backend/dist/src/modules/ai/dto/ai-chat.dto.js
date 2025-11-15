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
exports.AiChatResponseDto = exports.AiChatRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const trimValue = ({ value }) => typeof value === 'string' ? value.trim() : value;
class AiChatRequestDto {
}
exports.AiChatRequestDto = AiChatRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '会话 ID' }),
    (0, class_transformer_1.Transform)(trimValue),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], AiChatRequestDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '用户输入的文本内容' }),
    (0, class_transformer_1.Transform)(trimValue),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], AiChatRequestDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '用户上传的图片 URL 列表',
        type: String,
        isArray: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(50),
    (0, class_transformer_1.Type)(() => String),
    __metadata("design:type", Array)
], AiChatRequestDto.prototype, "images", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '指定使用的模型' }),
    (0, class_transformer_1.Transform)(trimValue),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AiChatRequestDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '图片生成比例，例如 1:1、16:9、9:16；默认 1:1' }),
    (0, class_transformer_1.Transform)(trimValue),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AiChatRequestDto.prototype, "aspectRatio", void 0);
class AiChatResponseDto {
    constructor() {
        this.images = [];
    }
}
exports.AiChatResponseDto = AiChatResponseDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '模型回复的文本内容' }),
    __metadata("design:type", String)
], AiChatResponseDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '模型回复的图片 URL 列表',
        type: String,
        isArray: true,
    }),
    __metadata("design:type", Array)
], AiChatResponseDto.prototype, "images", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '模型返回的额外元信息，例如安全评级等',
        type: Object,
    }),
    __metadata("design:type", Object)
], AiChatResponseDto.prototype, "metadata", void 0);
//# sourceMappingURL=ai-chat.dto.js.map