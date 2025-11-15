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
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const session_entity_1 = require("./entities/session.entity");
const message_entity_1 = require("../message/entities/message.entity");
let SessionService = class SessionService {
    constructor(sessionModel, messageModel) {
        this.sessionModel = sessionModel;
        this.messageModel = messageModel;
    }
    async create(dto, userId) {
        const payload = {
            userId,
            title: dto.title?.trim() || '新对话',
            status: session_entity_1.SessionStatus.ACTIVE,
            pinned: dto.pinned ?? false,
        };
        return this.sessionModel.create(payload);
    }
    async findById(sessionId) {
        return this.sessionModel.findById(sessionId).exec();
    }
    async ensureExists(sessionId, userId) {
        const filter = { _id: sessionId };
        if (userId) {
            filter.userId = userId;
        }
        const session = await this.sessionModel.findOne(filter).exec();
        if (!session) {
            throw new common_1.NotFoundException('会话不存在或已删除');
        }
        return session;
    }
    async findByUser(userId, query) {
        const { limit, page } = query;
        const filter = {
            userId,
            status: session_entity_1.SessionStatus.ACTIVE,
        };
        const size = limit ?? 20;
        const currentPage = page ?? 1;
        const skip = (currentPage - 1) * size;
        return this.sessionModel
            .find(filter)
            .sort({ pinned: -1, updatedAt: -1 })
            .skip(skip)
            .limit(size)
            .exec();
    }
    async update(sessionId, userId, dto) {
        const update = {};
        if (dto.title !== undefined) {
            update.title = dto.title?.trim() || '新对话';
        }
        if (dto.status !== undefined) {
            update.status = dto.status;
        }
        if (dto.lastMessage !== undefined) {
            const trimmed = dto.lastMessage?.trim();
            if (trimmed && trimmed.length > 0) {
                update.lastMessage = trimmed;
            }
            else {
                update.$unset = { ...(update.$unset || {}), lastMessage: '' };
            }
        }
        if (dto.lastMessageAt) {
            update.lastMessageAt = new Date(dto.lastMessageAt);
        }
        if (dto.pinned !== undefined) {
            update.pinned = dto.pinned;
        }
        const updated = await this.sessionModel
            .findOneAndUpdate({ _id: sessionId, userId }, update, { new: true })
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException('会话不存在或已删除');
        }
        return updated;
    }
    async remove(sessionId, userId) {
        const deleted = await this.sessionModel
            .findOneAndDelete({ _id: sessionId, userId })
            .exec();
        if (!deleted) {
            throw new common_1.NotFoundException('会话不存在或已删除');
        }
        await this.messageModel
            .deleteMany({ sessionId: new mongoose_2.Types.ObjectId(sessionId) })
            .exec();
        return deleted;
    }
    async recordMessageActivity(sessionId, timestamp = new Date(), lastMessage) {
        const update = { lastMessageAt: timestamp };
        if (typeof lastMessage === 'string') {
            update.lastMessage = lastMessage;
        }
        await this.sessionModel
            .findByIdAndUpdate(sessionId, update, { new: false })
            .exec();
    }
    async findOneWithMessages(sessionId, userId) {
        const session = await this.sessionModel
            .findOne({ _id: sessionId, userId })
            .populate('messages')
            .exec();
        if (!session) {
            throw new common_1.NotFoundException('会话不存在或已删除');
        }
        return session;
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(session_entity_1.Session.name)),
    __param(1, (0, mongoose_1.InjectModel)(message_entity_1.Message.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], SessionService);
//# sourceMappingURL=session.service.js.map