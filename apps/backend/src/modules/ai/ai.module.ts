import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessageModule } from '../message/message.module';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { GeminiMessageAdapter } from './adapters/gemini-message.adapter';

@Module({
  imports: [ConfigModule, MessageModule],
  controllers: [AiController],
  providers: [AiService, GeminiMessageAdapter],
  exports: [AiService],
})
export class AiModule {}
