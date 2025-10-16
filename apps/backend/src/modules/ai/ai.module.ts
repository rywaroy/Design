import { Module } from '@nestjs/common';
import { MessageModule } from '../message/message.module';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  imports: [MessageModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
