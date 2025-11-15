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
exports.SessionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const session_service_1 = require("./session.service");
const session_dto_1 = require("./dto/session.dto");
const session_entity_1 = require("./entities/session.entity");
const auth_guard_1 = require("../../common/guards/auth.guard");
let SessionController = class SessionController {
    constructor(sessionService) {
        this.sessionService = sessionService;
    }
    create(req, dto) {
        const userId = req.user._id?.toString?.() ?? req.user.id;
        return this.sessionService.create(dto, userId);
    }
    findAll(req, query) {
        const userId = req.user._id?.toString?.() ?? req.user.id;
        return this.sessionService.findByUser(userId, query);
    }
    findOne(req, id) {
        const userId = req.user._id?.toString?.() ?? req.user.id;
        return this.sessionService.findOneWithMessages(id, userId);
    }
    update(req, id, dto) {
        const userId = req.user._id?.toString?.() ?? req.user.id;
        return this.sessionService.update(id, userId, dto);
    }
    remove(req, id) {
        const userId = req.user._id?.toString?.() ?? req.user.id;
        return this.sessionService.remove(id, userId);
    }
};
exports.SessionController = SessionController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建新的会话' }),
    (0, swagger_1.ApiOkResponse)({ description: '创建成功', type: session_entity_1.Session }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, session_dto_1.CreateSessionDto]),
    __metadata("design:returntype", void 0)
], SessionController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '按用户列出会话' }),
    (0, swagger_1.ApiOkResponse)({ description: '返回会话数组', type: [session_entity_1.Session] }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, session_dto_1.ListSessionQueryDto]),
    __metadata("design:returntype", void 0)
], SessionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取单个会话详情' }),
    (0, swagger_1.ApiOkResponse)({ description: '会话详情', type: session_entity_1.Session }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SessionController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新已有会话' }),
    (0, swagger_1.ApiOkResponse)({ description: '更新后的会话', type: session_entity_1.Session }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, session_dto_1.UpdateSessionDto]),
    __metadata("design:returntype", void 0)
], SessionController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除会话并清理消息' }),
    (0, swagger_1.ApiOkResponse)({ description: '已删除的会话', type: session_entity_1.Session }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SessionController.prototype, "remove", null);
exports.SessionController = SessionController = __decorate([
    (0, swagger_1.ApiTags)('AI Session'),
    (0, common_1.Controller)('sessions'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [session_service_1.SessionService])
], SessionController);
//# sourceMappingURL=session.controller.js.map