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
exports.ScreenPreciseSearchQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const transformToArray = (value) => {
    if (Array.isArray(value)) {
        return value
            .map((item) => (typeof item === 'string' ? item.trim() : undefined))
            .filter((item) => !!item);
    }
    if (typeof value === 'string' && value.trim() !== '') {
        return value
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    }
    return undefined;
};
const trimValue = ({ value }) => typeof value === 'string' ? value.trim() : value;
class ScreenPreciseSearchQueryDto {
    constructor() {
        this.page = 1;
        this.pageSize = 10;
    }
}
exports.ScreenPreciseSearchQueryDto = ScreenPreciseSearchQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '当前页码', default: 1 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Object)
], ScreenPreciseSearchQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '每页数量', default: 10 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Object)
], ScreenPreciseSearchQueryDto.prototype, "pageSize", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '项目 ID' }),
    (0, class_transformer_1.Transform)(trimValue),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScreenPreciseSearchQueryDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '平台',
        enum: ['ios', 'web'],
        type: [String],
    }),
    (0, class_transformer_1.Transform)(({ value }) => transformToArray(value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ScreenPreciseSearchQueryDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '页面二级类型', type: [String] }),
    (0, class_transformer_1.Transform)(({ value }) => transformToArray(value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ScreenPreciseSearchQueryDto.prototype, "pageTypeL2", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '应用二级分类', type: [String] }),
    (0, class_transformer_1.Transform)(({ value }) => transformToArray(value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ScreenPreciseSearchQueryDto.prototype, "appCategoryL2", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '设计体系', type: [String] }),
    (0, class_transformer_1.Transform)(({ value }) => transformToArray(value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ScreenPreciseSearchQueryDto.prototype, "designSystem", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '二级类型', type: [String] }),
    (0, class_transformer_1.Transform)(({ value }) => transformToArray(value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ScreenPreciseSearchQueryDto.prototype, "typeL2", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '间距', type: [String] }),
    (0, class_transformer_1.Transform)(({ value }) => transformToArray(value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ScreenPreciseSearchQueryDto.prototype, "spacing", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '密度', type: [String] }),
    (0, class_transformer_1.Transform)(({ value }) => transformToArray(value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ScreenPreciseSearchQueryDto.prototype, "density", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '组件二级索引，精确匹配所有值',
        type: [String],
    }),
    (0, class_transformer_1.Transform)(({ value }) => transformToArray(value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ScreenPreciseSearchQueryDto.prototype, "componentIndexL2", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '一级标签二级内容，需全部命中',
        type: [String],
    }),
    (0, class_transformer_1.Transform)(({ value }) => transformToArray(value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ScreenPreciseSearchQueryDto.prototype, "tagsPrimaryL2", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '样式标签二级内容，需全部命中',
        type: [String],
    }),
    (0, class_transformer_1.Transform)(({ value }) => transformToArray(value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ScreenPreciseSearchQueryDto.prototype, "tagsStyleL2", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '组件标签二级内容，需全部命中',
        type: [String],
    }),
    (0, class_transformer_1.Transform)(({ value }) => transformToArray(value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ScreenPreciseSearchQueryDto.prototype, "tagsComponentsL2", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '设计风格，需全部命中',
        type: [String],
    }),
    (0, class_transformer_1.Transform)(({ value }) => transformToArray(value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ScreenPreciseSearchQueryDto.prototype, "designStyle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '情感标签，需全部命中',
        type: [String],
    }),
    (0, class_transformer_1.Transform)(({ value }) => transformToArray(value)),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ScreenPreciseSearchQueryDto.prototype, "feeling", void 0);
//# sourceMappingURL=screen-precise-search-query.dto.js.map