import { HydratedDocument } from 'mongoose';
export declare enum SessionStatus {
    ACTIVE = "active",
    ARCHIVED = "archived"
}
export declare class Session {
    userId: string;
    title: string;
    status: SessionStatus;
    lastMessage?: string;
    lastMessageAt?: Date;
    pinned?: boolean;
}
export type SessionDocument = HydratedDocument<Session>;
export declare const SessionSchema: import("mongoose").Schema<Session, import("mongoose").Model<Session, any, any, any, import("mongoose").Document<unknown, any, Session, any, {}> & Session & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Session, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Session>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Session> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
