import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ModelConfig,
  ModelConfigSchema,
} from './entities/model.entity';
import { ModelService } from './model.service';
import { ModelController } from './model.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: ModelConfig.name, schema: ModelConfigSchema },
    ]),
  ],
  providers: [ModelService],
  controllers: [ModelController],
  exports: [ModelService],
})
export class ModelModule {}
