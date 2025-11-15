import { HydratedDocument } from 'mongoose';
export declare class ModelConfig {
    name: string;
    model: string;
    baseUrl?: string;
    apiKey?: string;
    provider?: string;
    adapter: string;
    enabled?: boolean;
    description?: string;
}
export type ModelConfigDocument = HydratedDocument<ModelConfig>;
export declare const ModelConfigSchema: import("mongoose").Schema<ModelConfig, import("mongoose").Model<ModelConfig, any, any, any, import("mongoose").Document<unknown, any, ModelConfig, any, {}> & ModelConfig & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ModelConfig, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ModelConfig>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<ModelConfig> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
