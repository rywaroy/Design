import { HydratedDocument } from 'mongoose';
export declare enum FavoriteTargetType {
    PROJECT = "project",
    SCREEN = "screen"
}
export declare class Favorite {
    userId: string;
    targetType: FavoriteTargetType;
    targetId: string;
}
export type FavoriteDocument = HydratedDocument<Favorite>;
export declare const FavoriteSchema: import("mongoose").Schema<Favorite, import("mongoose").Model<Favorite, any, any, any, import("mongoose").Document<unknown, any, Favorite, any, {}> & Favorite & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Favorite, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Favorite>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Favorite> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
