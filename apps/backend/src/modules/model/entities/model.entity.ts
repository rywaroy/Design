import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, collection: 'models' })
export class ModelConfig {
  @Prop({ type: String, required: true, unique: true })
  name!: string; // 业务可读的名称，例如："gemini-image-prod"

  @Prop({ type: String, required: true })
  model!: string; // 供应商的模型标识，例如："gemini-2.5-flash-image"

  @Prop({ type: String })
  baseUrl?: string; // API 基地址

  @Prop({ type: String })
  apiKey?: string; // 访问密钥（可选，缺省使用全局配置）

  @Prop({ type: String })
  provider?: string; // 厂商，例如：OpenAI、Google

  @Prop({ type: String, required: true })
  adapter!: string; // 适配器名称，例如："gemini image"

  @Prop({ type: Boolean, default: true })
  enabled?: boolean;

  @Prop({ type: String })
  description?: string;
}

export type ModelConfigDocument = HydratedDocument<ModelConfig>;
export const ModelConfigSchema = SchemaFactory.createForClass(ModelConfig);
ModelConfigSchema.index({ name: 1 }, { unique: true });
ModelConfigSchema.index({ model: 1 });
