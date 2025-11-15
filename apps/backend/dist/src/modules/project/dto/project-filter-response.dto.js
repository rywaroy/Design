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
exports.ProjectFilterResponseDto = exports.ProjectFilterCategoryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ProjectFilterCategoryDto {
}
exports.ProjectFilterCategoryDto = ProjectFilterCategoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '筛选类别 key，例如 application_type 等' }),
    __metadata("design:type", String)
], ProjectFilterCategoryDto.prototype, "key", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '筛选类别名称' }),
    __metadata("design:type", String)
], ProjectFilterCategoryDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], description: '可选项列表（第一层或子分类）' }),
    __metadata("design:type", Array)
], ProjectFilterCategoryDto.prototype, "options", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '父级名称（仅在查询子分类时返回）',
        required: false,
    }),
    __metadata("design:type", String)
], ProjectFilterCategoryDto.prototype, "parent", void 0);
class ProjectFilterResponseDto {
}
exports.ProjectFilterResponseDto = ProjectFilterResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [ProjectFilterCategoryDto],
        description: '筛选类别集合，默认返回所有类别的第一层可选项',
    }),
    __metadata("design:type", Array)
], ProjectFilterResponseDto.prototype, "categories", void 0);
//# sourceMappingURL=project-filter-response.dto.js.map