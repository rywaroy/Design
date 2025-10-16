import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessageModule } from '../message/message.module';
import { ModelModule } from '../model/model.module';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { GeminiImageAdapter } from './adapters/gemini-image.adapter';

@Module({
  imports: [ConfigModule, MessageModule, ModelModule],
  controllers: [AiController],
  providers: [AiService, GeminiImageAdapter],
  exports: [AiService],
})
export class AiModule {}
