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
exports.MessageController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const message_service_1 = require("./message.service");
const message_dto_1 = require("./dto/message.dto");
const message_entity_1 = require("./entities/message.entity");
let MessageController = class MessageController {
    constructor(messageService) {
        this.messageService = messageService;
    }
    create(dto) {
        return this.messageService.create(dto);
    }
    list(query) {
        return this.messageService.list(query);
    }
    findOne(id) {
        return this.messageService.findOne(id);
    }
};
exports.MessageController = MessageController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建新消息' }),
    (0, swagger_1.ApiOkResponse)({ description: '已创建的消息', type: message_entity_1.Message }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [message_dto_1.CreateMessageDto]),
    __metadata("design:returntype", void 0)
], MessageController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '按会话列出消息' }),
    (0, swagger_1.ApiOkResponse)({ description: '消息数组', type: [message_entity_1.Message] }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [message_dto_1.ListMessageQueryDto]),
    __metadata("design:returntype", void 0)
], MessageController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '查看单条消息' }),
    (0, swagger_1.ApiOkResponse)({ description: '消息详情', type: message_entity_1.Message }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MessageController.prototype, "findOne", null);
exports.MessageController = MessageController = __decorate([
    (0, swagger_1.ApiTags)('AI Message'),
    (0, common_1.Controller)('messages'),
    __metadata("design:paramtypes", [message_service_1.MessageService])
], MessageController);
//# sourceMappingURL=message.controller.js.map