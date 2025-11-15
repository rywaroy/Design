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
var MessageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const message_entity_1 = require("./entities/message.entity");
const session_service_1 = require("../session/session.service");
let MessageService = MessageService_1 = class MessageService {
    constructor(messageModel, sessionService) {
        this.messageModel = messageModel;
        this.sessionService = sessionService;
    }
    async create(dto) {
        await this.sessionService.ensureExists(dto.sessionId);
        const normalizedContent = MessageService_1.normalizeContent(dto.content);
        const normalizedImages = MessageService_1.normalizeImages(dto.images);
        if (!normalizedContent && normalizedImages.length === 0) {
            throw new common_1.BadRequestException('消息内容不能为空');
        }
        const contentValue = normalizedContent ?? '';
        const createdAt = dto.createdAt ? new Date(dto.createdAt) : undefined;
        const payload = {
            sessionId: new mongoose_2.Types.ObjectId(dto.sessionId),
            role: dto.role,
            content: contentValue,
        };
        if (normalizedImages.length > 0) {
            payload.images = normalizedImages;
        }
        if (dto.metadata) {
            payload.metadata = dto.metadata;
        }
        if (createdAt) {
            payload.createdAt = createdAt;
        }
        const message = await this.messageModel.create(payload);
        const lastMessageSummary = MessageService_1.deriveLastMessage(contentValue, normalizedImages);
        await this.sessionService.recordMessageActivity(dto.sessionId, message.createdAt, lastMessageSummary);
        return message;
    }
    async list(query) {
        await this.sessionService.ensureExists(query.sessionId);
        const filter = {
            sessionId: new mongoose_2.Types.ObjectId(query.sessionId),
        };
        if (query.before) {
            filter.createdAt = { $lt: new Date(query.before) };
        }
        const size = query.limit ?? 50;
        return this.messageModel
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(size)
            .exec();
    }
    async findOne(messageId) {
        return this.messageModel.findById(messageId).exec();
    }
    static normalizeContent(content) {
        if (typeof content !== 'string') {
            return undefined;
        }
        const trimmed = content.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }
    static normalizeImages(images) {
        if (!Array.isArray(images)) {
            return [];
        }
        const sanitized = images
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter((item) => item.length > 0);
        return Array.from(new Set(sanitized));
    }
    static deriveLastMessage(content, images) {
        if (content.trim()) {
            return MessageService_1.truncatePreview(content);
        }
        if (images.length) {
            return '[多媒体消息]';
        }
        return undefined;
    }
    static truncatePreview(value) {
        if (value.length <= MessageService_1.PREVIEW_LIMIT) {
            return value;
        }
        return value.slice(0, MessageService_1.PREVIEW_LIMIT);
    }
};
exports.MessageService = MessageService;
MessageService.PREVIEW_LIMIT = 200;
exports.MessageService = MessageService = MessageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(message_entity_1.Message.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        session_service_1.SessionService])
], MessageService);
//# sourceMappingURL=message.service.js.map