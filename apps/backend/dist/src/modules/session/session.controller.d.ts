import { SessionService } from './session.service';
import { CreateSessionDto, ListSessionQueryDto, UpdateSessionDto } from './dto/session.dto';
import { Session } from './entities/session.entity';
export declare class SessionController {
    private readonly sessionService;
    constructor(sessionService: SessionService);
    create(req: any, dto: CreateSessionDto): Promise<import("mongoose").Document<unknown, {}, Session, {}, {}> & Session & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    findAll(req: any, query: ListSessionQueryDto): Promise<(import("mongoose").Document<unknown, {}, Session, {}, {}> & Session & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    findOne(req: any, id: string): Promise<import("mongoose").Document<unknown, {}, Session, {}, {}> & Session & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    update(req: any, id: string, dto: UpdateSessionDto): Promise<import("mongoose").Document<unknown, {}, Session, {}, {}> & Session & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    remove(req: any, id: string): Promise<import("mongoose").Document<unknown, {}, Session, {}, {}> & Session & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
}
