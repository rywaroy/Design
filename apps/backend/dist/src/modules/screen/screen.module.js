"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const screen_controller_1 = require("./screen.controller");
const screen_service_1 = require("./screen.service");
const screen_entity_1 = require("./entities/screen.entity");
const favorite_entity_1 = require("../favorite/entities/favorite.entity");
const screen_ai_service_1 = require("./screen-ai.service");
const ai_module_1 = require("../ai/ai.module");
let ScreenModule = class ScreenModule {
};
exports.ScreenModule = ScreenModule;
exports.ScreenModule = ScreenModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: screen_entity_1.Screen.name, schema: screen_entity_1.ScreenSchema },
                { name: favorite_entity_1.Favorite.name, schema: favorite_entity_1.FavoriteSchema },
            ]),
            ai_module_1.AiModule,
        ],
        controllers: [screen_controller_1.ScreenController],
        providers: [screen_service_1.ScreenService, screen_ai_service_1.ScreenAiService],
        exports: [screen_service_1.ScreenService, screen_ai_service_1.ScreenAiService],
    })
], ScreenModule);
//# sourceMappingURL=screen.module.js.map