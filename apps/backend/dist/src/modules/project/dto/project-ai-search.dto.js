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
exports.ProjectAiSearchResponseDto = exports.ProjectAiMetaDto = exports.ProjectAiTagsDto = exports.ProjectAiDimensionIntentDto = exports.ProjectAiDimensionSelectionDto = exports.ProjectAiSearchRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
const trimValue = ({ value }) => typeof value === 'string' ? value.trim() : value;
class ProjectAiSearchRequestDto {
    constructor() {
        this.page = 1;
        this.pageSize = 10;
    }
}
exports.ProjectAiSearchRequestDto = ProjectAiSearchRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户提供的需求描述' }),
    (0, class_transformer_1.Transform)(trimValue),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], ProjectAiSearchRequestDto.prototype, "requirement", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '当前页码', default: 1 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Object)
], ProjectAiSearchRequestDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '每页数量', default: 10 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Object)
], ProjectAiSearchRequestDto.prototype, "pageSize", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '限定平台，可选 ios 或 web' }),
    (0, class_transformer_1.Transform)(trimValue),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProjectAiSearchRequestDto.prototype, "platform", void 0);
class ProjectAiDimensionSelectionDto {
    constructor() {
        this.firstLevel = [];
        this.secondLevel = [];
        this.mapping = {};
    }
}
exports.ProjectAiDimensionSelectionDto = ProjectAiDimensionSelectionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '一级标签（大类）', type: [String] }),
    __metadata("design:type", Array)
], ProjectAiDimensionSelectionDto.prototype, "firstLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '二级标签', type: [String] }),
    __metadata("design:type", Array)
], ProjectAiDimensionSelectionDto.prototype, "secondLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '一级标签到二级标签的映射',
        type: Object,
    }),
    __metadata("design:type", Object)
], ProjectAiDimensionSelectionDto.prototype, "mapping", void 0);
class ProjectAiDimensionIntentDto {
}
exports.ProjectAiDimensionIntentDto = ProjectAiDimensionIntentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否提及该维度' }),
    __metadata("design:type", Boolean)
], ProjectAiDimensionIntentDto.prototype, "relevant", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '模型给出的判断原因' }),
    __metadata("design:type", String)
], ProjectAiDimensionIntentDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '模型置信度，0-1 之间的小数' }),
    __metadata("design:type", Number)
], ProjectAiDimensionIntentDto.prototype, "confidence", void 0);
class ProjectAiTagsDto {
    constructor() {
        this.applicationType = new ProjectAiDimensionSelectionDto();
        this.industrySector = new ProjectAiDimensionSelectionDto();
    }
}
exports.ProjectAiTagsDto = ProjectAiTagsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '应用类型标签选择',
        type: ProjectAiDimensionSelectionDto,
    }),
    __metadata("design:type", Object)
], ProjectAiTagsDto.prototype, "applicationType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '行业领域标签选择',
        type: ProjectAiDimensionSelectionDto,
    }),
    __metadata("design:type", Object)
], ProjectAiTagsDto.prototype, "industrySector", void 0);
class ProjectAiMetaDto {
    constructor() {
        this.intent = {};
    }
}
exports.ProjectAiMetaDto = ProjectAiMetaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '维度意图识别结果',
        type: () => ProjectAiDimensionIntentDto,
        isArray: false,
    }),
    __metadata("design:type", Object)
], ProjectAiMetaDto.prototype, "intent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '模型返回的提示信息' }),
    __metadata("design:type", String)
], ProjectAiMetaDto.prototype, "notice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '原始模型回复片段，用于调试',
        type: [String],
    }),
    __metadata("design:type", Array)
], ProjectAiMetaDto.prototype, "rawResponses", void 0);
class ProjectAiSearchResponseDto {
}
exports.ProjectAiSearchResponseDto = ProjectAiSearchResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'AI 解析后的标签结果',
        type: ProjectAiTagsDto,
    }),
    __metadata("design:type", ProjectAiTagsDto)
], ProjectAiSearchResponseDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '模型诊断信息与提示',
        type: ProjectAiMetaDto,
    }),
    __metadata("design:type", ProjectAiMetaDto)
], ProjectAiSearchResponseDto.prototype, "llmMeta", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '基于标签的项目搜索结果',
        type: () => pagination_dto_1.PaginationDto,
    }),
    __metadata("design:type", pagination_dto_1.PaginationDto)
], ProjectAiSearchResponseDto.prototype, "search", void 0);
//# sourceMappingURL=project-ai-search.dto.js.map