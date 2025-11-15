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
exports.ModelController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const model_service_1 = require("./model.service");
const model_dto_1 = require("./dto/model.dto");
let ModelController = class ModelController {
    constructor(modelService) {
        this.modelService = modelService;
    }
    async list() {
        const items = await this.modelService.listAll();
        return items.map((modelConfig) => ({
            name: modelConfig.name,
            model: modelConfig.model,
            provider: modelConfig.provider,
            adapter: modelConfig.adapter,
            enabled: modelConfig.enabled ?? true,
            description: modelConfig.description,
            createdAt: modelConfig.createdAt,
            updatedAt: modelConfig.updatedAt,
        }));
    }
};
exports.ModelController = ModelController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '列出所有模型配置（不分页）' }),
    (0, swagger_1.ApiOkResponse)({ type: [model_dto_1.ModelListItemDto], description: '模型配置列表' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModelController.prototype, "list", null);
exports.ModelController = ModelController = __decorate([
    (0, swagger_1.ApiTags)('Model'),
    (0, common_1.Controller)('models'),
    __metadata("design:paramtypes", [model_service_1.ModelService])
], ModelController);
//# sourceMappingURL=model.controller.js.map