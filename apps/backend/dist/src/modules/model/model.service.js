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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const mongoose_2 = require("mongoose");
const model_entity_1 = require("./entities/model.entity");
let ModelService = class ModelService {
    constructor(modelConfigModel, configService) {
        this.modelConfigModel = modelConfigModel;
        this.configService = configService;
    }
    async resolveForChat(inputModel) {
        const trimmed = inputModel?.trim();
        if (!trimmed) {
            throw new common_1.BadRequestException('未指定模型');
        }
        const found = await this.modelConfigModel
            .findOne({ $or: [{ name: trimmed }, { model: trimmed }], enabled: true })
            .lean()
            .exec();
        if (!found) {
            throw new common_1.BadRequestException(`未找到模型: ${trimmed}`);
        }
        return {
            name: found.name,
            model: found.model,
            baseUrl: found.baseUrl,
            apiKey: found.apiKey,
            adapter: found.adapter,
        };
    }
    async listAll() {
        return this.modelConfigModel.find({}).sort({ createdAt: -1 }).lean().exec();
    }
};
exports.ModelService = ModelService;
exports.ModelService = ModelService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(model_entity_1.ModelConfig.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        config_1.ConfigService])
], ModelService);
//# sourceMappingURL=model.service.js.map