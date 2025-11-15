import { MessageService } from './message.service';
import { CreateMessageDto, ListMessageQueryDto } from './dto/message.dto';
import { Message } from './entities/message.entity';
export declare class MessageController {
    private readonly messageService;
    constructor(messageService: MessageService);
    create(dto: CreateMessageDto): Promise<import("mongoose").Document<unknown, {}, Message, {}, {}> & Message & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    list(query: ListMessageQueryDto): Promise<(import("mongoose").Document<unknown, {}, Message, {}, {}> & Message & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, Message, {}, {}> & Message & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
}
