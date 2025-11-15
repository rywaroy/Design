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
exports.ListSessionQueryDto = exports.UpdateSessionDto = exports.CreateSessionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_2 = require("@nestjs/swagger");
const session_entity_1 = require("../entities/session.entity");
class CreateSessionDto {
}
exports.CreateSessionDto = CreateSessionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, swagger_2.ApiPropertyOptional)({ description: '会话标题，未提供时默认使用“新对话”' }),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, swagger_2.ApiPropertyOptional)({ description: '是否固定在顶部，默认 false' }),
    __metadata("design:type", Boolean)
], CreateSessionDto.prototype, "pinned", void 0);
class UpdateSessionDto extends (0, swagger_1.PartialType)(CreateSessionDto) {
}
exports.UpdateSessionDto = UpdateSessionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(session_entity_1.SessionStatus),
    (0, swagger_2.ApiPropertyOptional)({ description: '会话状态（active/archived）' }),
    __metadata("design:type", String)
], UpdateSessionDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, swagger_2.ApiPropertyOptional)({ description: '最近一条消息内容摘要' }),
    __metadata("design:type", String)
], UpdateSessionDto.prototype, "lastMessage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_2.ApiPropertyOptional)({ description: '更新时间戳，用于外部同步' }),
    __metadata("design:type", Date)
], UpdateSessionDto.prototype, "lastMessageAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, swagger_2.ApiPropertyOptional)({ description: '是否固定在顶部' }),
    __metadata("design:type", Boolean)
], UpdateSessionDto.prototype, "pinned", void 0);
class ListSessionQueryDto {
}
exports.ListSessionQueryDto = ListSessionQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, swagger_2.ApiPropertyOptional)({ description: '返回数量限制，默认 20，最大 100' }),
    __metadata("design:type", Number)
], ListSessionQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, swagger_2.ApiPropertyOptional)({ description: '页码，默认 1' }),
    __metadata("design:type", Number)
], ListSessionQueryDto.prototype, "page", void 0);
//# sourceMappingURL=session.dto.js.map