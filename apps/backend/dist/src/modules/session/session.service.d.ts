import { Model } from 'mongoose';
import { SessionDocument } from './entities/session.entity';
import { MessageDocument } from '../message/entities/message.entity';
import { CreateSessionDto, ListSessionQueryDto, UpdateSessionDto } from './dto/session.dto';
export declare class SessionService {
    private readonly sessionModel;
    private readonly messageModel;
    constructor(sessionModel: Model<SessionDocument>, messageModel: Model<MessageDocument>);
    create(dto: CreateSessionDto, userId: string): Promise<SessionDocument>;
    findById(sessionId: string): Promise<SessionDocument | null>;
    ensureExists(sessionId: string, userId?: string): Promise<SessionDocument>;
    findByUser(userId: string, query: ListSessionQueryDto): Promise<SessionDocument[]>;
    update(sessionId: string, userId: string, dto: UpdateSessionDto): Promise<SessionDocument>;
    remove(sessionId: string, userId: string): Promise<SessionDocument>;
    recordMessageActivity(sessionId: string, timestamp?: Date, lastMessage?: string): Promise<void>;
    findOneWithMessages(sessionId: string, userId: string): Promise<SessionDocument>;
}
