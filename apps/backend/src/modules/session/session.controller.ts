import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionService } from './session.service';
import {
  CreateSessionDto,
  ListSessionQueryDto,
  UpdateSessionDto,
} from './dto/session.dto';
import { Session } from './entities/session.entity';
import { AuthGuard } from '../../common/guards/auth.guard';

@ApiTags('AI Session')
@Controller('sessions')
@UseGuards(AuthGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @ApiOperation({ summary: '创建新的会话' })
  @ApiOkResponse({ description: '创建成功', type: Session })
  create(@Request() req, @Body() dto: CreateSessionDto) {
    const userId = req.user._id?.toString?.() ?? req.user.id;
    return this.sessionService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: '按用户列出会话' })
  @ApiOkResponse({ description: '返回会话数组', type: [Session] })
  findAll(@Request() req, @Query() query: ListSessionQueryDto) {
    const userId = req.user._id?.toString?.() ?? req.user.id;
    return this.sessionService.findByUser(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个会话详情' })
  @ApiOkResponse({ description: '会话详情', type: Session })
  findOne(@Request() req, @Param('id') id: string) {
    const userId = req.user._id?.toString?.() ?? req.user.id;
    return this.sessionService.findOneWithMessages(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新已有会话' })
  @ApiOkResponse({ description: '更新后的会话', type: Session })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
  ) {
    const userId = req.user._id?.toString?.() ?? req.user.id;
    return this.sessionService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除会话并清理消息' })
  @ApiOkResponse({ description: '已删除的会话', type: Session })
  remove(@Request() req, @Param('id') id: string) {
    const userId = req.user._id?.toString?.() ?? req.user.id;
    return this.sessionService.remove(id, userId);
  }
}
