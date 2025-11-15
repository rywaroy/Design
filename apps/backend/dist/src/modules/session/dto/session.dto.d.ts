import { SessionStatus } from '../entities/session.entity';
export declare class CreateSessionDto {
    title?: string;
    pinned?: boolean;
}
declare const UpdateSessionDto_base: import("@nestjs/common").Type<Partial<CreateSessionDto>>;
export declare class UpdateSessionDto extends UpdateSessionDto_base {
    status?: SessionStatus;
    lastMessage?: string;
    lastMessageAt?: Date;
    pinned?: boolean;
}
export declare class ListSessionQueryDto {
    limit?: number;
    page?: number;
}
export {};
