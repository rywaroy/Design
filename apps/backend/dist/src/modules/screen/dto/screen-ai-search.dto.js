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
exports.ScreenAiSearchResponseDto = exports.ScreenAiMetaDto = exports.ScreenAiTagsDto = exports.ScreenAiDimensionIntentDto = exports.ScreenAiDimensionSelectionDto = exports.ScreenAiSearchRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
const trimValue = ({ value }) => typeof value === 'string' ? value.trim() : value;
class ScreenAiSearchRequestDto {
    constructor() {
        this.page = 1;
        this.pageSize = 10;
    }
}
exports.ScreenAiSearchRequestDto = ScreenAiSearchRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户提供的需求描述' }),
    (0, class_transformer_1.Transform)(trimValue),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], ScreenAiSearchRequestDto.prototype, "requirement", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '当前页码', default: 1 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Object)
], ScreenAiSearchRequestDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '每页数量', default: 10 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Object)
], ScreenAiSearchRequestDto.prototype, "pageSize", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '项目 ID' }),
    (0, class_transformer_1.Transform)(trimValue),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScreenAiSearchRequestDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '平台', enum: ['ios', 'web'] }),
    (0, class_transformer_1.Transform)(trimValue),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScreenAiSearchRequestDto.prototype, "platform", void 0);
class ScreenAiDimensionSelectionDto {
    constructor() {
        this.firstLevel = [];
        this.secondLevel = [];
        this.mapping = {};
    }
}
exports.ScreenAiDimensionSelectionDto = ScreenAiDimensionSelectionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '一级标签（大类）', type: [String] }),
    __metadata("design:type", Array)
], ScreenAiDimensionSelectionDto.prototype, "firstLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '二级标签', type: [String] }),
    __metadata("design:type", Array)
], ScreenAiDimensionSelectionDto.prototype, "secondLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '一级标签到二级标签的映射',
        type: Object,
    }),
    __metadata("design:type", Object)
], ScreenAiDimensionSelectionDto.prototype, "mapping", void 0);
class ScreenAiDimensionIntentDto {
}
exports.ScreenAiDimensionIntentDto = ScreenAiDimensionIntentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否提及该维度' }),
    __metadata("design:type", Boolean)
], ScreenAiDimensionIntentDto.prototype, "relevant", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '模型给出的判断原因' }),
    __metadata("design:type", String)
], ScreenAiDimensionIntentDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '模型置信度，0-1 之间的小数' }),
    __metadata("design:type", Number)
], ScreenAiDimensionIntentDto.prototype, "confidence", void 0);
class ScreenAiTagsDto {
    constructor() {
        this.appCategory = new ScreenAiDimensionSelectionDto();
        this.componentIndex = new ScreenAiDimensionSelectionDto();
        this.layoutType = new ScreenAiDimensionSelectionDto();
        this.pageType = new ScreenAiDimensionSelectionDto();
        this.tagsPrimary = new ScreenAiDimensionSelectionDto();
        this.tagsStyle = new ScreenAiDimensionSelectionDto();
        this.tagsComponents = new ScreenAiDimensionSelectionDto();
    }
}
exports.ScreenAiTagsDto = ScreenAiTagsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '应用类别标签选择',
        type: ScreenAiDimensionSelectionDto,
    }),
    __metadata("design:type", Object)
], ScreenAiTagsDto.prototype, "appCategory", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '组件索引标签选择',
        type: ScreenAiDimensionSelectionDto,
    }),
    __metadata("design:type", Object)
], ScreenAiTagsDto.prototype, "componentIndex", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '页面布局标签选择',
        type: ScreenAiDimensionSelectionDto,
    }),
    __metadata("design:type", Object)
], ScreenAiTagsDto.prototype, "layoutType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '页面类型标签选择',
        type: ScreenAiDimensionSelectionDto,
    }),
    __metadata("design:type", Object)
], ScreenAiTagsDto.prototype, "pageType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '核心功能标签选择',
        type: ScreenAiDimensionSelectionDto,
    }),
    __metadata("design:type", Object)
], ScreenAiTagsDto.prototype, "tagsPrimary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '视觉风格标签选择',
        type: ScreenAiDimensionSelectionDto,
    }),
    __metadata("design:type", Object)
], ScreenAiTagsDto.prototype, "tagsStyle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '组件标签选择',
        type: ScreenAiDimensionSelectionDto,
    }),
    __metadata("design:type", Object)
], ScreenAiTagsDto.prototype, "tagsComponents", void 0);
class ScreenAiMetaDto {
    constructor() {
        this.intent = {};
    }
}
exports.ScreenAiMetaDto = ScreenAiMetaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '维度意图识别结果',
        type: () => ScreenAiDimensionIntentDto,
        isArray: false,
    }),
    __metadata("design:type", Object)
], ScreenAiMetaDto.prototype, "intent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '模型返回的提示信息' }),
    __metadata("design:type", String)
], ScreenAiMetaDto.prototype, "notice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '原始模型回复片段，用于调试',
        type: [String],
    }),
    __metadata("design:type", Array)
], ScreenAiMetaDto.prototype, "rawResponses", void 0);
class ScreenAiSearchResponseDto {
}
exports.ScreenAiSearchResponseDto = ScreenAiSearchResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'AI 解析后的标签结果',
        type: ScreenAiTagsDto,
    }),
    __metadata("design:type", ScreenAiTagsDto)
], ScreenAiSearchResponseDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '模型诊断信息与提示',
        type: ScreenAiMetaDto,
    }),
    __metadata("design:type", ScreenAiMetaDto)
], ScreenAiSearchResponseDto.prototype, "llmMeta", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '基于标签的模糊搜索结果',
        type: () => pagination_dto_1.PaginationDto,
    }),
    __metadata("design:type", pagination_dto_1.PaginationDto)
], ScreenAiSearchResponseDto.prototype, "search", void 0);
//# sourceMappingURL=screen-ai-search.dto.js.map