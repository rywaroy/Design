import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true })
  platform: string;

  @Prop({ required: true })
  appName: string;

  @Prop()
  appLogoUrl?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  projectId: string;

  @Prop({ type: [String], default: [] })
  previewScreens: string[];

  @Prop({ required: true, default: 0 })
  screenCount: number;

  @Prop({ required: true, default: 0 })
  recommendedCount: number;

  @Prop()
  appTagline?: string;

  @Prop({ type: [String], default: [] })
  keywords?: string[];
}

export type ProjectDocument = HydratedDocument<Project>;

export const ProjectSchema = SchemaFactory.createForClass(Project);
