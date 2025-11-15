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
exports.ModelConfigSchema = exports.ModelConfig = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let ModelConfig = class ModelConfig {
};
exports.ModelConfig = ModelConfig;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, unique: true }),
    __metadata("design:type", String)
], ModelConfig.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], ModelConfig.prototype, "model", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], ModelConfig.prototype, "baseUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], ModelConfig.prototype, "apiKey", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], ModelConfig.prototype, "provider", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], ModelConfig.prototype, "adapter", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], ModelConfig.prototype, "enabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], ModelConfig.prototype, "description", void 0);
exports.ModelConfig = ModelConfig = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'models' })
], ModelConfig);
exports.ModelConfigSchema = mongoose_1.SchemaFactory.createForClass(ModelConfig);
exports.ModelConfigSchema.index({ name: 1 }, { unique: true });
exports.ModelConfigSchema.index({ model: 1 });
//# sourceMappingURL=model.entity.js.map