import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Message, MessageDocument } from './entities/message.entity';
import { CreateMessageDto, ListMessageQueryDto } from './dto/message.dto';
import { SessionService } from '../session/session.service';

@Injectable()
export class MessageService {
  private static readonly PREVIEW_LIMIT = 200;

  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    private readonly sessionService: SessionService,
  ) {}

  async create(dto: CreateMessageDto): Promise<MessageDocument> {
    await this.sessionService.ensureExists(dto.sessionId);

    if (!dto.content && (!dto.parts || dto.parts.length === 0)) {
      throw new BadRequestException('必须提供 content 或 parts 之一');
    }

    const createdAt = dto.createdAt ? new Date(dto.createdAt) : undefined;

    const storedContent = dto.content ?? JSON.stringify(dto.parts || []);

    const payload: Record<string, unknown> = {
      sessionId: new Types.ObjectId(dto.sessionId),
      role: dto.role,
      content: storedContent,
    };

    if (dto.model) {
      payload.model = dto.model;
    }

    if (dto.metadata) {
      payload.metadata = dto.metadata;
    }

    if (createdAt) {
      payload.createdAt = createdAt;
    }

    const message = await this.messageModel.create(payload);
    const lastMessageSummary = MessageService.deriveLastMessage(dto);

    await this.sessionService.recordMessageActivity(
      dto.sessionId,
      message.createdAt,
      lastMessageSummary,
    );

    return message;
  }

  async list(query: ListMessageQueryDto): Promise<MessageDocument[]> {
    await this.sessionService.ensureExists(query.sessionId);

    const filter: FilterQuery<MessageDocument> = {
      sessionId: new Types.ObjectId(query.sessionId),
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

  async findOne(messageId: string): Promise<MessageDocument | null> {
    return this.messageModel.findById(messageId).exec();
  }

  private static deriveLastMessage(dto: CreateMessageDto): string | undefined {
    if (dto.parts?.length) {
      const texts = dto.parts
        .map((part) => part.text?.trim())
        .filter((text): text is string => !!text);
      if (texts.length) {
        return MessageService.truncatePreview(texts.join('\n'));
      }

      if (dto.parts.some((part) => part.inlineData)) {
        return '[多媒体消息]';
      }
    }

    if (dto.content?.trim()) {
      const trimmed = dto.content.trim();

      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const texts = parsed
            .map((item) =>
              typeof item?.text === 'string' ? item.text.trim() : '',
            )
            .filter((text) => text.length > 0);
          if (texts.length) {
            return MessageService.truncatePreview(texts.join('\n'));
          }
          if (parsed.some((item) => item?.inlineData)) {
            return '[多媒体消息]';
          }
          return undefined;
        }
      } catch {
        // treated as plain text below
      }

      return MessageService.truncatePreview(trimmed);
    }

    return undefined;
  }

  private static truncatePreview(value: string): string {
    if (value.length <= MessageService.PREVIEW_LIMIT) {
      return value;
    }
    return value.slice(0, MessageService.PREVIEW_LIMIT);
  }
}
