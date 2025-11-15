"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const project_controller_1 = require("./project.controller");
const project_service_1 = require("./project.service");
const project_entity_1 = require("./entities/project.entity");
const favorite_entity_1 = require("../favorite/entities/favorite.entity");
const project_ai_service_1 = require("./project-ai.service");
const ai_module_1 = require("../ai/ai.module");
let ProjectModule = class ProjectModule {
};
exports.ProjectModule = ProjectModule;
exports.ProjectModule = ProjectModule = __decorate([
    (0, common_1.Module)({
        imports: [
            ai_module_1.AiModule,
            mongoose_1.MongooseModule.forFeature([
                { name: project_entity_1.Project.name, schema: project_entity_1.ProjectSchema },
                { name: favorite_entity_1.Favorite.name, schema: favorite_entity_1.FavoriteSchema },
            ]),
        ],
        controllers: [project_controller_1.ProjectController],
        providers: [project_service_1.ProjectService, project_ai_service_1.ProjectAiService],
        exports: [project_service_1.ProjectService, project_ai_service_1.ProjectAiService],
    })
], ProjectModule);
//# sourceMappingURL=project.module.js.map