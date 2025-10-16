import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessageService } from './message.service';
import { CreateMessageDto, ListMessageQueryDto } from './dto/message.dto';
import { Message } from './entities/message.entity';

@ApiTags('AI Message')
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @ApiOperation({ summary: '创建新消息' })
  @ApiOkResponse({ description: '已创建的消息', type: Message })
  create(@Body() dto: CreateMessageDto) {
    return this.messageService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '按会话列出消息' })
  @ApiOkResponse({ description: '消息数组', type: [Message] })
  list(@Query() query: ListMessageQueryDto) {
    return this.messageService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '查看单条消息' })
  @ApiOkResponse({ description: '消息详情', type: Message })
  findOne(@Param('id') id: string) {
    return this.messageService.findOne(id);
  }
}
