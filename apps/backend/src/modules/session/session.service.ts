import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types, UpdateQuery } from 'mongoose';
import {
  Session,
  SessionDocument,
  SessionStatus,
} from './entities/session.entity';
import { Message, MessageDocument } from '../message/entities/message.entity';
import {
  CreateSessionDto,
  ListSessionQueryDto,
  UpdateSessionDto,
} from './dto/session.dto';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  async create(
    dto: CreateSessionDto,
    userId: string,
  ): Promise<SessionDocument> {
    const payload: Partial<Session> = {
      userId,
      title: dto.title?.trim() || '新对话',
      status: SessionStatus.ACTIVE,
    };

    return this.sessionModel.create(payload);
  }

  async findById(sessionId: string): Promise<SessionDocument | null> {
    return this.sessionModel.findById(sessionId).exec();
  }

  async ensureExists(
    sessionId: string,
    userId?: string,
  ): Promise<SessionDocument> {
    const filter: FilterQuery<SessionDocument> = { _id: sessionId };
    if (userId) {
      filter.userId = userId;
    }

    const session = await this.sessionModel.findOne(filter).exec();
    if (!session) {
      throw new NotFoundException('会话不存在或已删除');
    }
    return session;
  }

  async findByUser(
    userId: string,
    query: ListSessionQueryDto,
  ): Promise<SessionDocument[]> {
    const { limit, page } = query;
    const filter: FilterQuery<SessionDocument> = {
      userId,
      status: SessionStatus.ACTIVE,
    };

    const size = limit ?? 20;
    const currentPage = page ?? 1;
    const skip = (currentPage - 1) * size;

    return this.sessionModel
      .find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(size)
      .exec();
  }

  async update(
    sessionId: string,
    userId: string,
    dto: UpdateSessionDto,
  ): Promise<SessionDocument> {
    const update: UpdateQuery<SessionDocument> = {};

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
      } else {
        update.$unset = { ...(update.$unset || {}), lastMessage: '' };
      }
    }

    if (dto.lastMessageAt) {
      update.lastMessageAt = new Date(dto.lastMessageAt);
    }

    const updated = await this.sessionModel
      .findOneAndUpdate({ _id: sessionId, userId }, update, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('会话不存在或已删除');
    }

    return updated;
  }

  async remove(sessionId: string, userId: string): Promise<SessionDocument> {
    const deleted = await this.sessionModel
      .findOneAndDelete({ _id: sessionId, userId })
      .exec();

    if (!deleted) {
      throw new NotFoundException('会话不存在或已删除');
    }

    await this.messageModel
      .deleteMany({ sessionId: new Types.ObjectId(sessionId) })
      .exec();

    return deleted;
  }

  async recordMessageActivity(
    sessionId: string,
    timestamp: Date = new Date(),
    lastMessage?: string,
  ): Promise<void> {
    const update: UpdateQuery<SessionDocument> = { lastMessageAt: timestamp };
    if (typeof lastMessage === 'string') {
      update.lastMessage = lastMessage;
    }

    await this.sessionModel
      .findByIdAndUpdate(sessionId, update, { new: false })
      .exec();
  }

  async findOneWithMessages(
    sessionId: string,
    userId: string,
  ): Promise<SessionDocument> {
    const session = await this.sessionModel
      .findOne({ _id: sessionId, userId })
      .populate('messages')
      .exec();

    if (!session) {
      throw new NotFoundException('会话不存在或已删除');
    }

    return session;
  }
}
