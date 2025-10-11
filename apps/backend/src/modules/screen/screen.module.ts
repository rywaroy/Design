import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScreenController } from './screen.controller';
import { ScreenService } from './screen.service';
import { Screen, ScreenSchema } from './entities/screen.entity';
import { ScreenAiService } from './screen-ai.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Screen.name, schema: ScreenSchema }]),
    AiModule,
  ],
  controllers: [ScreenController],
  providers: [ScreenService, ScreenAiService],
  exports: [ScreenService, ScreenAiService],
})
export class ScreenModule {}
