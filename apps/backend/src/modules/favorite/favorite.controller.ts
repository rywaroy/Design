import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/decorator/pagination.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { FavoriteQueryDto } from './dto/favorite-query.dto';
import { FavoriteService } from './favorite.service';
import { Project } from '../project/entities/project.entity';
import { Screen } from '../screen/entities/screen.entity';

@ApiTags('收藏')
@UseGuards(AuthGuard)
@Controller('favorite')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post('projects/:projectId')
  @HttpCode(200)
  @ApiOperation({ summary: '收藏项目' })
  addProjectFavorite(@Request() req, @Param('projectId') projectId: string) {
    const userId = req.user?.id ?? req.user?._id?.toString();
    return this.favoriteService.addProjectFavorite(userId, projectId);
  }

  @Post('screens/:screenId')
  @HttpCode(200)
  @ApiOperation({ summary: '收藏页面' })
  addScreenFavorite(@Request() req, @Param('screenId') screenId: string) {
    const userId = req.user?.id ?? req.user?._id?.toString();
    return this.favoriteService.addScreenFavorite(userId, screenId);
  }

  @Get('projects')
  @ApiOperation({ summary: '获取项目收藏列表' })
  @ApiPaginatedResponse(Project, '获取项目收藏列表成功')
  findProjectFavorites(@Request() req, @Query() query: FavoriteQueryDto) {
    const userId = req.user?.id ?? req.user?._id?.toString();
    return this.favoriteService.findProjectFavorites(userId, query);
  }

  @Get('screens')
  @ApiOperation({ summary: '获取页面收藏列表' })
  @ApiPaginatedResponse(Screen, '获取页面收藏列表成功')
  findScreenFavorites(@Request() req, @Query() query: FavoriteQueryDto) {
    const userId = req.user?.id ?? req.user?._id?.toString();
    return this.favoriteService.findScreenFavorites(userId, query);
  }

  @Delete('projects/:projectId')
  @HttpCode(200)
  @ApiOperation({ summary: '取消项目收藏' })
  cancelProjectFavorite(@Request() req, @Param('projectId') projectId: string) {
    const userId = req.user?.id ?? req.user?._id?.toString();
    return this.favoriteService.removeProjectFavorite(userId, projectId);
  }

  @Delete('screens/:screenId')
  @HttpCode(200)
  @ApiOperation({ summary: '取消页面收藏' })
  cancelScreenFavorite(@Request() req, @Param('screenId') screenId: string) {
    const userId = req.user?.id ?? req.user?._id?.toString();
    return this.favoriteService.removeScreenFavorite(userId, screenId);
  }
}
