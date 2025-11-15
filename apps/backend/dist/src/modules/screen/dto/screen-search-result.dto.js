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
exports.ScreenSearchResultDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const screen_entity_1 = require("../entities/screen.entity");
class ScreenSearchResultDto extends screen_entity_1.Screen {
}
exports.ScreenSearchResultDto = ScreenSearchResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '匹配度百分比', example: 75.5 }),
    __metadata("design:type", Number)
], ScreenSearchResultDto.prototype, "matchPercentage", void 0);
//# sourceMappingURL=screen-search-result.dto.js.map