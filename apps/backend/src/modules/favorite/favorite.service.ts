import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { FavoriteQueryDto } from './dto/favorite-query.dto';
import {
  Favorite,
  FavoriteDocument,
  FavoriteTargetType,
} from './entities/favorite.entity';
import { Project, ProjectDocument } from '../project/entities/project.entity';
import { Screen, ScreenDocument } from '../screen/entities/screen.entity';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectModel(Favorite.name)
    private readonly favoriteModel: Model<FavoriteDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Screen.name)
    private readonly screenModel: Model<ScreenDocument>,
  ) {}

  private async ensureProjectExists(projectId: string): Promise<void> {
    const exists = await this.projectModel.exists({ projectId }).exec();
    if (!exists) {
      throw new NotFoundException('项目不存在');
    }
  }

  private async ensureScreenExists(screenId: string): Promise<void> {
    const exists = await this.screenModel.exists({ screenId }).exec();
    if (!exists) {
      throw new NotFoundException('页面不存在');
    }
  }

  async addProjectFavorite(
    userId: string,
    projectId: string,
  ): Promise<boolean> {
    await this.ensureProjectExists(projectId);
    await this.favoriteModel.updateOne(
      { userId, targetType: FavoriteTargetType.PROJECT, targetId: projectId },
      {
        $setOnInsert: {
          userId,
          targetType: FavoriteTargetType.PROJECT,
          targetId: projectId,
        },
      },
      { upsert: true },
    );
    return true;
  }

  async removeProjectFavorite(
    userId: string,
    projectId: string,
  ): Promise<boolean> {
    const result = await this.favoriteModel.deleteOne({
      userId,
      targetType: FavoriteTargetType.PROJECT,
      targetId: projectId,
    });
    return result.deletedCount > 0;
  }

  async addScreenFavorite(userId: string, screenId: string): Promise<boolean> {
    await this.ensureScreenExists(screenId);
    await this.favoriteModel.updateOne(
      { userId, targetType: FavoriteTargetType.SCREEN, targetId: screenId },
      {
        $setOnInsert: {
          userId,
          targetType: FavoriteTargetType.SCREEN,
          targetId: screenId,
        },
      },
      { upsert: true },
    );
    return true;
  }

  async removeScreenFavorite(
    userId: string,
    screenId: string,
  ): Promise<boolean> {
    const result = await this.favoriteModel.deleteOne({
      userId,
      targetType: FavoriteTargetType.SCREEN,
      targetId: screenId,
    });
    return result.deletedCount > 0;
  }

  async findProjectFavorites(
    userId: string,
    query: FavoriteQueryDto,
  ): Promise<PaginationDto<Project>> {
    const { page = 1, pageSize = 10 } = query;
    const skip = (page - 1) * pageSize;
    const filter = {
      userId,
      targetType: FavoriteTargetType.PROJECT,
    };

    const [favorites, total] = await Promise.all([
      this.favoriteModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec(),
      this.favoriteModel.countDocuments(filter).exec(),
    ]);

    if (!favorites.length) {
      return {
        items: [],
        total,
        page,
        pageSize,
      };
    }

    const projectIds = favorites.map((favorite) => favorite.targetId);
    const projects = await this.projectModel
      .find({ projectId: { $in: projectIds } })
      .lean()
      .exec();
    const projectMap = new Map(
      projects.map((project) => [project.projectId, project]),
    );

    const items = projectIds
      .map((projectId) => projectMap.get(projectId))
      .filter(Boolean);

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async findScreenFavorites(
    userId: string,
    query: FavoriteQueryDto,
  ): Promise<PaginationDto<Screen>> {
    const { page = 1, pageSize = 10 } = query;
    const skip = (page - 1) * pageSize;
    const filter = {
      userId,
      targetType: FavoriteTargetType.SCREEN,
    };

    const [favorites, total] = await Promise.all([
      this.favoriteModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec(),
      this.favoriteModel.countDocuments(filter).exec(),
    ]);

    if (!favorites.length) {
      return {
        items: [],
        total,
        page,
        pageSize,
      };
    }

    const screenIds = favorites.map((favorite) => favorite.targetId);
    const screens = await this.screenModel
      .find({ screenId: { $in: screenIds } })
      .lean()
      .exec();
    const screenMap = new Map(
      screens.map((screen) => [screen.screenId, screen]),
    );

    const items = screenIds
      .map((screenId) => screenMap.get(screenId))
      .filter(Boolean);

    return {
      items,
      total,
      page,
      pageSize,
    };
  }
}
