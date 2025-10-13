import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Favorite, FavoriteSchema } from './entities/favorite.entity';
import { FavoriteService } from './favorite.service';
import { FavoriteController } from './favorite.controller';
import { Project, ProjectSchema } from '../project/entities/project.entity';
import { Screen, ScreenSchema } from '../screen/entities/screen.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Favorite.name, schema: FavoriteSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Screen.name, schema: ScreenSchema },
    ]),
  ],
  controllers: [FavoriteController],
  providers: [FavoriteService],
})
export class FavoriteModule {}
