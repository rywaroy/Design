import { Model } from 'mongoose';
import { MessageDocument } from './entities/message.entity';
import { CreateMessageDto, ListMessageQueryDto } from './dto/message.dto';
import { SessionService } from '../session/session.service';
export declare class MessageService {
    private readonly messageModel;
    private readonly sessionService;
    private static readonly PREVIEW_LIMIT;
    constructor(messageModel: Model<MessageDocument>, sessionService: SessionService);
    create(dto: CreateMessageDto): Promise<MessageDocument>;
    list(query: ListMessageQueryDto): Promise<MessageDocument[]>;
    findOne(messageId: string): Promise<MessageDocument | null>;
    private static normalizeContent;
    private static normalizeImages;
    private static deriveLastMessage;
    private static truncatePreview;
}
