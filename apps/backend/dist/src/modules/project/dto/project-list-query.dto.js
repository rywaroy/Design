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
exports.ProjectListQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const toStringArray = ({ value }) => {
    if (Array.isArray(value)) {
        return value
            .map((item) => (typeof item === 'string' ? item.trim() : null))
            .filter((item) => Boolean(item));
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    }
    return undefined;
};
class ProjectListQueryDto {
    constructor() {
        this.page = 1;
        this.pageSize = 10;
    }
}
exports.ProjectListQueryDto = ProjectListQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '当前页码', default: 1 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Object)
], ProjectListQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '每页数量', default: 10 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Object)
], ProjectListQueryDto.prototype, "pageSize", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '限定平台，可选 ios 或 web',
        enum: ['ios', 'web'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['ios', 'web']),
    __metadata("design:type", String)
], ProjectListQueryDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '按应用名称模糊匹配' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProjectListQueryDto.prototype, "appName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '按应用类型筛选，多个值逗号分隔或重复传参，满足任意一个即可',
        type: [String],
    }),
    (0, class_transformer_1.Transform)(toStringArray),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ProjectListQueryDto.prototype, "applicationType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '按行业领域筛选，多个值逗号分隔或重复传参，满足任意一个即可',
        type: [String],
    }),
    (0, class_transformer_1.Transform)(toStringArray),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ProjectListQueryDto.prototype, "industrySector", void 0);
//# sourceMappingURL=project-list-query.dto.js.map