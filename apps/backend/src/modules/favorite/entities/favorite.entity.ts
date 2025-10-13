import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum FavoriteTargetType {
  PROJECT = 'project',
  SCREEN = 'screen',
}

@Schema({ timestamps: true })
export class Favorite {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({
    required: true,
    enum: [FavoriteTargetType.PROJECT, FavoriteTargetType.SCREEN],
    index: true,
  })
  targetType: FavoriteTargetType;

  @Prop({ required: true })
  targetId: string;
}

export type FavoriteDocument = HydratedDocument<Favorite>;

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

FavoriteSchema.index(
  { userId: 1, targetType: 1, targetId: 1 },
  { unique: true },
);
