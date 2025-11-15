import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { ModelConfig, ModelConfigDocument } from './entities/model.entity';
export interface ResolvedModelConfig {
    name?: string;
    model: string;
    baseUrl?: string;
    apiKey?: string;
    adapter?: string;
}
export declare class ModelService {
    private readonly modelConfigModel;
    private readonly configService;
    constructor(modelConfigModel: Model<ModelConfigDocument>, configService: ConfigService);
    resolveForChat(inputModel?: string): Promise<ResolvedModelConfig>;
    listAll(): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, ModelConfig, {}, {}> & ModelConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
}
