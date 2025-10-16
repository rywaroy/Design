import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ModelService } from './model.service';
import { ModelListItemDto } from './dto/model.dto';

@ApiTags('Model')
@Controller('models')
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Get()
  @ApiOperation({ summary: '列出所有模型配置（不分页）' })
  @ApiOkResponse({ type: [ModelListItemDto], description: '模型配置列表' })
  async list(): Promise<ModelListItemDto[]> {
    const items = await this.modelService.listAll();
    return items.map((modelConfig) => ({
      name: modelConfig.name,
      model: modelConfig.model,
      provider: modelConfig.provider,
      adapter: modelConfig.adapter,
      enabled: modelConfig.enabled ?? true,
      description: modelConfig.description,
      createdAt: (modelConfig as any).createdAt,
      updatedAt: (modelConfig as any).updatedAt,
    }));
  }
}
