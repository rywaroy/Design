import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Screen {
  @Prop({ required: true, index: true })
  projectId: string;

  @Prop({ required: true, unique: true })
  screenId: string;

  @Prop()
  originalUrl?: string;

  @Prop()
  url?: string;

  @Prop({ default: false })
  isRecommended: boolean;

  @Prop({ default: 0 })
  order: number;

  @Prop()
  pageType?: string;

  @Prop()
  pageTypeL2?: string;

  @Prop()
  platform?: string;

  @Prop()
  appCategory?: string;

  @Prop()
  appCategoryL2?: string;

  @Prop()
  intent?: string;

  @Prop()
  designSystem?: string;

  @Prop()
  type?: string;

  @Prop()
  spacing?: string;

  @Prop()
  density?: string;

  @Prop()
  typeL2?: string;

  @Prop({ type: [String], default: [] })
  componentIndex: string[];

  @Prop({ type: [String], default: [] })
  componentIndexL2: string[];

  @Prop({ type: [String], default: [] })
  tagsPrimary: string[];

  @Prop({ type: [String], default: [] })
  tagsPrimaryL2: string[];

  @Prop({ type: [String], default: [] })
  tagsStyle: string[];

  @Prop({ type: [String], default: [] })
  tagsStyleL2: string[];

  @Prop({ type: [String], default: [] })
  tagsComponents: string[];

  @Prop({ type: [String], default: [] })
  tagsComponentsL2: string[];

  @Prop({ type: [String], default: [] })
  designStyle: string[];

  @Prop({ type: [String], default: [] })
  feeling: string[];

  // timestamps added by @Schema({ timestamps: true })
  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;

  // 非持久化字段：标记当前用户是否收藏
  isFavorite?: boolean;
}

export type ScreenDocument = HydratedDocument<Screen>;

export const ScreenSchema = SchemaFactory.createForClass(Screen);
