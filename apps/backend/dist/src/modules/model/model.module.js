"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const model_entity_1 = require("./entities/model.entity");
const model_service_1 = require("./model.service");
const model_controller_1 = require("./model.controller");
const config_1 = require("@nestjs/config");
let ModelModule = class ModelModule {
};
exports.ModelModule = ModelModule;
exports.ModelModule = ModelModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            mongoose_1.MongooseModule.forFeature([
                { name: model_entity_1.ModelConfig.name, schema: model_entity_1.ModelConfigSchema },
            ]),
        ],
        providers: [model_service_1.ModelService],
        controllers: [model_controller_1.ModelController],
        exports: [model_service_1.ModelService],
    })
], ModelModule);
//# sourceMappingURL=model.module.js.map