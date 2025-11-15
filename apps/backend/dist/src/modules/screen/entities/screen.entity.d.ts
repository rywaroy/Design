import { HydratedDocument } from 'mongoose';
export declare class Screen {
    projectId: string;
    screenId: string;
    originalUrl?: string;
    url?: string;
    isRecommended: boolean;
    order: number;
    pageType?: string;
    pageTypeL2?: string;
    platform?: string;
    appCategory?: string;
    appCategoryL2?: string;
    intent?: string;
    designSystem?: string;
    type?: string;
    spacing?: string;
    density?: string;
    typeL2?: string;
    componentIndex: string[];
    componentIndexL2: string[];
    tagsPrimary: string[];
    tagsPrimaryL2: string[];
    tagsStyle: string[];
    tagsStyleL2: string[];
    tagsComponents: string[];
    tagsComponentsL2: string[];
    designStyle: string[];
    feeling: string[];
    createdAt?: Date;
    updatedAt?: Date;
    isFavorite?: boolean;
}
export type ScreenDocument = HydratedDocument<Screen>;
export declare const ScreenSchema: import("mongoose").Schema<Screen, import("mongoose").Model<Screen, any, any, any, import("mongoose").Document<unknown, any, Screen, any, {}> & Screen & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Screen, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Screen>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Screen> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
