import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/decorator/pagination.decorator';
import { ScreenListQueryDto } from './dto/screen-list-query.dto';
import { ScreenFilterQueryDto } from './dto/screen-filter-query.dto';
import { ScreenFilterResponseDto } from './dto/screen-filter-response.dto';
import { ScreenFuzzySearchQueryDto } from './dto/screen-fuzzy-search-query.dto';
import { ScreenPreciseSearchQueryDto } from './dto/screen-precise-search-query.dto';
import { ScreenSearchResultDto } from './dto/screen-search-result.dto';
import {
  ScreenAiSearchRequestDto,
  ScreenAiSearchResponseDto,
} from './dto/screen-ai-search.dto';
import { ScreenService } from './screen.service';
import { Screen } from './entities/screen.entity';
import { ScreenAiService } from './screen-ai.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@ApiTags('页面')
@Controller('screen')
export class ScreenController {
  constructor(
    private readonly screenService: ScreenService,
    private readonly screenAiService: ScreenAiService,
  ) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: '根据项目查询页面列表' })
  @ApiPaginatedResponse(Screen, '查询成功')
  findByProject(@Request() req, @Query() query: ScreenListQueryDto) {
    const userId = (req.user?.id ?? req.user?._id?.toString()) as string;
    return this.screenService.findByProject(userId, query);
  }

  @Get('filters')
  @ApiOperation({ summary: '获取可供选择的解析字段值' })
  @ApiOkResponse({
    description: '筛选项获取成功',
    type: ScreenFilterResponseDto,
  })
  getFilters(@Query() query: ScreenFilterQueryDto) {
    return this.screenService.getFilterOptions(query);
  }

  @UseGuards(AuthGuard)
  @Post('search/precise')
  @ApiOperation({ summary: '精准搜索页面（全部命中条件）' })
  @ApiPaginatedResponse(Screen, '精准搜索成功')
  preciseSearch(@Request() req, @Body() query: ScreenPreciseSearchQueryDto) {
    const userId = (req.user?.id ?? req.user?._id?.toString()) as string;
    return this.screenService.preciseSearch(userId, query);
  }

  @UseGuards(AuthGuard)
  @Post('search/fuzzy')
  @ApiOperation({ summary: '模糊搜索页面（命中 50% 以上解析字段）' })
  @ApiPaginatedResponse(ScreenSearchResultDto, '模糊搜索成功')
  fuzzySearch(@Request() req, @Body() query: ScreenFuzzySearchQueryDto) {
    const userId = (req.user?.id ?? req.user?._id?.toString()) as string;
    return this.screenService.fuzzySearch(userId, query);
  }

  @UseGuards(AuthGuard)
  @Post('search/ai')
  @ApiOperation({ summary: 'AI 解析需求并执行模糊搜索' })
  @ApiOkResponse({
    description: 'AI 标签解析与模糊搜索结果',
    type: ScreenAiSearchResponseDto,
  })
  aiFuzzySearch(@Request() req, @Body() body: ScreenAiSearchRequestDto) {
    const userId = (req.user?.id ?? req.user?._id?.toString()) as string;
    return this.screenAiService.searchWithRequirement(userId, body);
  }
}
