import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { Project, ProjectSchema } from './entities/project.entity';
import { Favorite, FavoriteSchema } from '../favorite/entities/favorite.entity';
import { ProjectAiService } from './project-ai.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    AiModule,
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Favorite.name, schema: FavoriteSchema },
    ]),
  ],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectAiService],
  exports: [ProjectService, ProjectAiService],
})
export class ProjectModule {}
