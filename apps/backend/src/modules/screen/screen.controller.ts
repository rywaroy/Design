import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/decorator/pagination.decorator';
import { ScreenListQueryDto } from './dto/screen-list-query.dto';
import { ScreenFilterQueryDto } from './dto/screen-filter-query.dto';
import { ScreenFilterResponseDto } from './dto/screen-filter-response.dto';
import { ScreenFuzzySearchQueryDto } from './dto/screen-fuzzy-search-query.dto';
import { ScreenPreciseSearchQueryDto } from './dto/screen-precise-search-query.dto';
import { ScreenSearchResultDto } from './dto/screen-search-result.dto';
import { ScreenService } from './screen.service';
import { Screen } from './entities/screen.entity';

@ApiTags('页面')
@Controller('screen')
export class ScreenController {
  constructor(private readonly screenService: ScreenService) {}

  @Get()
  @ApiOperation({ summary: '根据项目查询页面列表' })
  @ApiOkResponse({
    description: '查询成功',
    type: Screen,
    isArray: true,
  })
  findByProject(@Query() query: ScreenListQueryDto) {
    return this.screenService.findByProjectId(query.projectId);
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

  @Post('search/precise')
  @ApiOperation({ summary: '精准搜索页面（全部命中条件）' })
  @ApiPaginatedResponse(Screen, '精准搜索成功')
  preciseSearch(@Body() query: ScreenPreciseSearchQueryDto) {
    return this.screenService.preciseSearch(query);
  }

  @Post('search/fuzzy')
  @ApiOperation({ summary: '模糊搜索页面（命中 50% 以上解析字段）' })
  @ApiPaginatedResponse(ScreenSearchResultDto, '模糊搜索成功')
  fuzzySearch(@Body() query: ScreenFuzzySearchQueryDto) {
    return this.screenService.fuzzySearch(query);
  }
}
