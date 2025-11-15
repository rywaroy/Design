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
exports.ModelListItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ModelListItemDto {
}
exports.ModelListItemDto = ModelListItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '配置名称（唯一）' }),
    __metadata("design:type", String)
], ModelListItemDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '供应商模型标识' }),
    __metadata("design:type", String)
], ModelListItemDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '厂商，例如 OpenAI、Google' }),
    __metadata("design:type", String)
], ModelListItemDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '适配器名称' }),
    __metadata("design:type", String)
], ModelListItemDto.prototype, "adapter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否启用' }),
    __metadata("design:type", Boolean)
], ModelListItemDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '描述' }),
    __metadata("design:type", String)
], ModelListItemDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '创建时间' }),
    __metadata("design:type", Date)
], ModelListItemDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '更新时间' }),
    __metadata("design:type", Date)
], ModelListItemDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=model.dto.js.map