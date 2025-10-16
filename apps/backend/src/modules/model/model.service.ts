import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
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

@Injectable()
export class ModelService {
  constructor(
    @InjectModel(ModelConfig.name)
    private readonly modelConfigModel: Model<ModelConfigDocument>,
    private readonly configService: ConfigService,
  ) {}

  async resolveForChat(inputModel?: string): Promise<ResolvedModelConfig> {
    const trimmed = inputModel?.trim();
    if (!trimmed) {
      throw new BadRequestException('未指定模型');
    }

    const found = await this.modelConfigModel
      .findOne({ $or: [{ name: trimmed }, { model: trimmed }], enabled: true })
      .lean()
      .exec();

    if (!found) {
      throw new BadRequestException(`未找到模型: ${trimmed}`);
    }

    return {
      name: found.name,
      model: found.model,
      baseUrl: found.baseUrl,
      apiKey: found.apiKey,
      adapter: found.adapter,
    };
  }

  async listAll() {
    return this.modelConfigModel.find({}).sort({ createdAt: -1 }).lean().exec();
  }
}
