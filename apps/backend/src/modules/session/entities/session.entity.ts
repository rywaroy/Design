import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum SessionStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

@Schema({
  timestamps: true,
  collection: 'sessions',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Session {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ type: String, enum: SessionStatus, default: SessionStatus.ACTIVE })
  status: SessionStatus;

  @Prop({ type: String, maxlength: 500 })
  lastMessage?: string;

  @Prop({ type: Date })
  lastMessageAt?: Date;

  @Prop({ type: Boolean, default: false })
  pinned?: boolean;
}

export type SessionDocument = HydratedDocument<Session>;

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({ userId: 1, updatedAt: -1 });
SessionSchema.index({ userId: 1, status: 1 });

SessionSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'sessionId',
  justOne: false,
  options: { sort: { createdAt: -1 } },
});
