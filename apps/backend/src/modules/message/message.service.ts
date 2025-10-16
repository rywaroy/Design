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

    const normalizedContent = MessageService.normalizeContent(dto.content);
    const normalizedImages = MessageService.normalizeImages(dto.images);

    if (!normalizedContent && normalizedImages.length === 0) {
      throw new BadRequestException('消息内容不能为空');
    }

    const contentValue = normalizedContent ?? '';

    const createdAt = dto.createdAt ? new Date(dto.createdAt) : undefined;

    const payload: Record<string, unknown> = {
      sessionId: new Types.ObjectId(dto.sessionId),
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
    const lastMessageSummary = MessageService.deriveLastMessage(
      contentValue,
      normalizedImages,
    );

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

  private static normalizeContent(content?: string): string | undefined {
    if (typeof content !== 'string') {
      return undefined;
    }
    const trimmed = content.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private static normalizeImages(images?: string[]): string[] {
    if (!Array.isArray(images)) {
      return [];
    }

    const sanitized = images
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);

    return Array.from(new Set(sanitized));
  }

  private static deriveLastMessage(
    content: string,
    images: string[],
  ): string | undefined {
    if (content.trim()) {
      return MessageService.truncatePreview(content);
    }

    if (images.length) {
      return '[多媒体消息]';
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
